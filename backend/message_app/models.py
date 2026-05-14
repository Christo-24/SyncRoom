from django.db import models
from django.contrib.auth.models import User
from django.utils.timesince import timesince
from django.core.exceptions import ValidationError  # FIXED: Added for content validation

from room_app.models import Room


def validate_message_content(value):
    """FIXED: Validator to ensure message content is not empty or too long"""
    if not value or not value.strip():
        raise ValidationError('Message content cannot be empty')
    if len(value) > 5000:
        raise ValidationError('Message cannot exceed 5000 characters')


class Message(models.Model):
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('seen', 'Seen'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    # FIXED: Added validators for content validation
    content = models.TextField(validators=[validate_message_content])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent', db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    seen_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['timestamp']
        # Add indexes for common queries
        indexes = [
            models.Index(fields=['room', 'timestamp']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'user'], name='msg_status_user_idx'),
            models.Index(fields=['room', 'status'], name='msg_room_status_idx'),
        ]
    
    def get_seen_time_ago(self):
        """Return a human-readable 'time ago' format for when message was seen"""
        if self.seen_at:
            return f"{timesince(self.seen_at)} ago"
        return None
    
    def __str__(self):
        return f'Message by {self.user.username} in {self.room.name}'