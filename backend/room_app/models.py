from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, UniqueConstraint  # FIXED: Added UniqueConstraint


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_private = models.BooleanField(default=False, db_index=True)
    participants = models.ManyToManyField(User, related_name='room_participants')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms_created')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_private', 'created_at']),
        ]
        # FIXED: Added constraint to prevent duplicate DM room names
        # This ensures database-level integrity for race condition protection
        constraints = [
            UniqueConstraint(
                fields=['name', 'is_private'],
                name='unique_private_room_name',
                condition=Q(is_private=True)
            ),
        ]

    def __str__(self):
        return f"DM: {self.id}" if self.is_private else self.name
