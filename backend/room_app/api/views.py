from django.contrib.auth.models import User
from django.db.models import Q
from django.db import transaction  # FIXED: Added for atomic operations
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializer import RoomSerializer, CreateDMSerializer, UserBasicSerializer
from ..models import Room
import traceback
import logging

logger = logging.getLogger(__name__)


class RoomViewSet(ModelViewSet):
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            return Room.objects.filter(
                Q(is_private=False) | Q(is_private=True, participants=self.request.user)
            ).select_related('created_by').prefetch_related('participants').distinct()
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            traceback.print_exc()
            return Room.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in RoomViewSet.list: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in RoomViewSet.retrieve: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        try:
            room = serializer.save(created_by=self.request.user)
            # Add creator to room participants
            room.participants.add(self.request.user)
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'rooms_group',
                {
                    'type': 'room_created',
                    'room': {
                        'id': room.id,
                        'name': room.name,
                        'created_by': room.created_by.username,
                        'created_at': room.created_at.isoformat(),
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            traceback.print_exc()
            raise

    @action(detail=False, methods=['get'])
    def my_rooms(self, request):
        try:
            rooms = Room.objects.filter(created_by=request.user)
            serializer = self.get_serializer(rooms, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in my_rooms: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'])
    def destroy_room(self, request, pk=None):
        try:
            room = self.get_object()
            if room.created_by != request.user:
                return Response(
                    {'detail': 'Permission denied. Only room creator can delete.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            room.delete()
            return Response(
                {'detail': 'Room deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Error in destroy_room: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        room = self.get_object()
        participants = room.participants.all()
        serializer = UserBasicSerializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_dms(self, request):
        dms = Room.objects.filter(
            is_private=True,
            participants=request.user
        ).distinct()
        serializer = self.get_serializer(dms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_dm(self, request):
        """Create or retrieve a DM room between two users.
        
        FIXED: Uses atomic get_or_create() to prevent race conditions when
        two users simultaneously initiate DM with each other.
        """
        from django.db import transaction
        
        serializer = CreateDMSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other_user_id = serializer.validated_data['user_id']
        
        if other_user_id == request.user.id:
            return Response(
                {'detail': 'Cannot create DM with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # FIXED: Use atomic transaction with get_or_create() to prevent race conditions
        # get_or_create() is atomic at the database level - only one room will be created
        with transaction.atomic():
            # Deterministic DM naming (lower user ID first)
            # This ensures both users create the same room name if they initiate simultaneously
            user_ids = sorted([request.user.id, other_user_id])
            dm_name = f"dm_{user_ids[0]}_{user_ids[1]}"
            
            # FIXED: Use get_or_create() instead of first() + create()
            # This is atomic - prevents duplicate DM rooms under concurrent load
            dm_room, created = Room.objects.get_or_create(
                name=dm_name,
                is_private=True,
                defaults={'created_by': request.user}
            )
            
            # Add participants (idempotent - safe to call multiple times)
            dm_room.participants.add(request.user, other_user)
            
            # Only broadcast creation for newly created rooms
            # This prevents duplicate notifications if both users initiated simultaneously
            if created:
                channel_layer = get_channel_layer()
                dm_data = {
                    'id': dm_room.id,
                    'name': dm_room.name,
                    'created_by': dm_room.created_by.username,
                    'created_at': dm_room.created_at.isoformat(),
                }
                # Notify both participants about new DM
                for user_id in [request.user.id, other_user.id]:
                    async_to_sync(channel_layer.group_send)(
                        f'user_{user_id}',
                        {
                            'type': 'dm_created',
                            'dm': dm_data
                        }
                    )
        
        dm_serializer = RoomSerializer(dm_room)
        return Response(dm_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)