from django.db.models import Q, Count
from django.utils import timezone
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import hashlib
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.pagination import CursorPagination  # FIXED: Added for pagination
from .serializer import MessageSerializer
from ..models import Message, Room
import traceback
import logging

logger = logging.getLogger(__name__)


# FIXED: Added cursor pagination for efficient message loading
class MessageCursorPagination(CursorPagination):
    """
    Cursor-based pagination for messages.
    - page_size: Number of messages per page (50)
    - ordering: By descending timestamp (newest first) for efficient pagination
    - cursor_query_param: Uses 'cursor' query parameter
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-timestamp'  # Newest messages first


class MessageViewSet(ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessageCursorPagination  # FIXED: Added pagination

    def get_queryset(self):
        try:
            room_id = self.request.query_params.get('room')
            if not room_id:
                return Message.objects.none()
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                return Message.objects.none()
            
            if not room.is_private or room.participants.filter(id=self.request.user.id).exists():
                # OPTIMIZATION: Use select_related to fetch user in one query instead of N queries
                # FIXED: Changed ordering from ascending to DESCENDING ('-timestamp')
                # This loads newest messages first - better for chat UX and pagination performance
                return Message.objects.filter(
                    room_id=room_id
                ).select_related('user').order_by('-timestamp')  # FIXED: Changed to -timestamp
            return Message.objects.none()
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            traceback.print_exc()
            return Message.objects.none()

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in MessageViewSet.list: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        try:
            room_id = serializer.validated_data.get('room').id
            room = Room.objects.get(id=room_id)
            if room.is_private and not room.participants.filter(id=self.request.user.id).exists():
                raise PermissionDenied("You don't have permission to message in this room")
            # Add user to room participants
            room.participants.add(self.request.user)
            serializer.save(user=self.request.user)
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            traceback.print_exc()
            raise

    @action(detail=False, methods=['post'])
    def mark_as_seen(self, request):
        """Mark all unread messages in a room as seen"""
        try:
            room_id = request.data.get('room_id')
            if not room_id:
                return Response({'error': 'room_id is required'}, status=400)
            
            try:
                room = Room.objects.get(id=room_id)
            except Room.DoesNotExist:
                return Response({'error': 'Room not found'}, status=404)
            
            # Check if user has access to the room
            if room.is_private and not room.participants.filter(id=request.user.id).exists():
                raise PermissionDenied("You don't have permission to access this room")
            
            # Use transaction to ensure immediate consistency
            with transaction.atomic():
                target_qs = Message.objects.filter(
                    room_id=room_id
                ).exclude(
                    user=request.user
                ).exclude(
                    status='seen'
                )

                updated_message_ids = list(
                    target_qs.values_list('id', flat=True)
                )

                # Mark all messages in the room as seen, excluding:
                # 1. Messages from the current user
                # 2. Messages already marked as seen
                updated = target_qs.update(
                    status='seen',
                    seen_at=timezone.now()
                )

            if room.is_private and updated_message_ids:
                channel_layer = get_channel_layer()

                if channel_layer is not None:
                    safe_room_name = hashlib.md5(
                        room.name.encode()
                    ).hexdigest()

                    room_group_name = f"chat_{safe_room_name}"

                    for message_id in updated_message_ids:
                        async_to_sync(channel_layer.group_send)(
                            room_group_name,
                            {
                                'type': 'message_status',
                                'message_id': message_id,
                                'status': 'seen',
                            }
                        )
            
            # Return confirmation that messages were marked as seen
            # Frontend will use this to clear the unread count immediately
            return Response({
                'status': 'seen',
                'updated': updated,
                'unread_count': 0
            })
        except Exception as e:
            logger.error(f"Error in mark_as_seen: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread message count for each room"""
        try:
            user = request.user
            # Get messages from rooms the user is in, excluding:
            # 1. Messages from the user themselves
            # 2. Messages that have been marked as seen (status='seen')
            # This includes both 'sent' and 'delivered' status messages
            data = (
                Message.objects.filter(
                    room__participants=user
                ).exclude(
                    user=user
                ).exclude(
                    status='seen'
                ).values('room').annotate(count=Count('id'))
            )
            return Response(data)
        except Exception as e:
            logger.error(f"Error in unread: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )