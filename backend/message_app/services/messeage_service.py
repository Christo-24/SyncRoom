from django.db import transaction
from django.utils import timezone

from room_app.models import Room
from message_app.models import Message


class MessageService:

    STATUS_RANK = {
        "sent": 1,
        "delivered": 2,
        "seen": 3,
    }

    @staticmethod
    def save_message_with_room_check(user, room_name, message):

        with transaction.atomic():

            room = Room.objects.get(name=room_name)

            was_participant = room.participants.filter(
                id=user.id
            ).exists()

            room.participants.add(user)

            # Keep backend authoritative: all new messages start as sent.
            initial_status = "sent"

            msg = Message.objects.create(
                user=user,
                room=room,
                content=message,
                status=initial_status
            )

            participant_ids = list(
                room.participants.values_list(
                    "id",
                    flat=True
                )
            )

            return (
                msg,
                not was_participant,
                room.is_private,
                participant_ids
            )

    @staticmethod
    def promote_message_status(message_id, target_status):

        if target_status not in MessageService.STATUS_RANK:
            return None

        try:
            msg = Message.objects.get(id=message_id)

            current_rank = MessageService.STATUS_RANK.get(
                msg.status,
                0
            )

            target_rank = MessageService.STATUS_RANK[target_status]

            if target_rank <= current_rank:
                return msg

            msg.status = target_status

            if target_status == "seen" and not msg.seen_at:
                msg.seen_at = timezone.now()

            msg.save(update_fields=["status", "seen_at"])

            return msg

        except Message.DoesNotExist:
            return None

    @staticmethod
    def update_message_status(message_id, status):
        return MessageService.promote_message_status(
            message_id,
            status
        )