from rest_framework import serializers
from ..models import Message


class UserMinimalSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


class MessageSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    seen_time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'user', 'room', 'content', 'status', 'timestamp', 'seen_at', 'seen_time_ago']
        read_only_fields = ['user', 'status', 'timestamp', 'seen_at']
    
    def get_seen_time_ago(self, obj):
        return obj.get_seen_time_ago()