from rest_framework import serializers
from ..models import Room
from django.contrib.auth.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class RoomSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_id = serializers.IntegerField(source='created_by.id', read_only=True)
    participants_list = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'is_private', 'created_by_id', 'created_by_username', 'participants_list', 'created_at']
        read_only_fields = ['id', 'created_by_id', 'created_at']

    def get_participants_list(self, obj):
        try:
            return UserBasicSerializer(obj.participants.all(), many=True).data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting participants: {str(e)}")
            return []


class CreateDMSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist")
        return value