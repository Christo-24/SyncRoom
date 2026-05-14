import json
import hashlib
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.utils import timezone

from message_app.services.room_service import RoomService
from message_app.services.messeage_service import MessageService
from message_app.services.presence_service import PresenceService

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]

        room_exists = await sync_to_async(
            RoomService.room_exists
        )(self.room_name)

        if not room_exists:
            await self.close(code=4004)
            return

        has_access = await sync_to_async(
            RoomService.user_has_access
        )(
            self.room_name,
            self.user
        )

        if not has_access:
            await self.close(code=4003)
            return

        safe_room_name = hashlib.md5(
            self.room_name.encode()
        ).hexdigest()

        self.room_group_name = f"chat_{safe_room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.channel_layer.group_add(
            f"user_{self.user.id}",
            self.channel_name
        )

        await self.accept()

        # ROOM ONLINE USERS

        room_online_key = (
            f"online_users_room_{self.room_name}"
        )

        await sync_to_async(
            PresenceService.add_online_user
        )(
            room_online_key,
            self.user.username
        )

        online_users = await sync_to_async(
            PresenceService.get_online_users
        )(
            room_online_key
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "online_users_update",
                "online_users": online_users
            }
        )

        # GLOBAL ONLINE USERS

        global_online_key = "global_online_users"

        await sync_to_async(
            PresenceService.add_online_user
        )(
            global_online_key,
            self.user.username
        )

    async def disconnect(self, close_code):

        try:

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            await self.channel_layer.group_discard(
                f"user_{self.user.id}",
                self.channel_name
            )

            room_online_key = (
                f"online_users_room_{self.room_name}"
            )

            await sync_to_async(
                PresenceService.remove_online_user
            )(
                room_online_key,
                self.user.username
            )

            online_users = await sync_to_async(
                PresenceService.get_online_users
            )(
                room_online_key
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "online_users_update",
                    "online_users": online_users
                }
            )

            global_online_key = "global_online_users"

            await sync_to_async(
                PresenceService.remove_online_user
            )(
                global_online_key,
                self.user.username
            )

        except Exception as e:
            logger.error(f"Disconnect error: {e}")

    async def receive(self, text_data):

        try:

            data = json.loads(text_data)

            message_type = data.get("type")

            # TYPING EVENT

            if message_type == "typing":

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "typing_event",
                        "user": self.user.username,
                        "typing": data.get("typing", False)
                    }
                )

                return

            # MESSAGE STATUS UPDATE

            if message_type == "status_update":
                # Backend is authoritative for DM status transitions.
                # Ignore client-initiated status updates.
                return

            # CHAT MESSAGE

            message = data.get("message", "").strip()

            if not message:
                return

            temp_id = data.get("temp_id")

            (
                msg_instance,
                is_new_participant,
                is_private,
                participant_ids
            ) = await sync_to_async(
                MessageService.save_message_with_room_check
            )(
                self.user,
                self.room_name,
                message
            )

            response_data = {
                "type": "chat_message",
                "message": msg_instance.content,
                "username": self.user.username,
                "timestamp": (
                    msg_instance.timestamp.isoformat()
                ),
                "message_id": msg_instance.id,
                "status": msg_instance.status,
                "room": self.room_name,
                "temp_id": temp_id
            }

            # DM status lifecycle:
            # sent on save -> delivered when recipient is online -> seen when recipient is in this DM.
            if is_private:

                participants = await sync_to_async(
                    RoomService.get_all_room_participants
                )(
                    self.room_name
                )

                recipient_usernames = [
                    participant["username"]
                    for participant in participants
                    if participant["id"] != self.user.id
                ]

                global_online_users = await sync_to_async(
                    PresenceService.get_online_users
                )(
                    "global_online_users"
                )

                room_online_users = await sync_to_async(
                    PresenceService.get_online_users
                )(
                    f"online_users_room_{self.room_name}"
                )

                target_status = None

                if any(
                    username in room_online_users
                    for username in recipient_usernames
                ):
                    target_status = "seen"

                elif any(
                    username in global_online_users
                    for username in recipient_usernames
                ):
                    target_status = "delivered"

                if target_status:
                    promoted = await sync_to_async(
                        MessageService.promote_message_status
                    )(
                        msg_instance.id,
                        target_status
                    )

                    if promoted:
                        msg_instance = promoted
                        response_data["status"] = promoted.status

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "data": response_data
                }
            )

            if is_private and response_data["status"] != "sent":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "message_status",
                        "message_id": msg_instance.id,
                        "status": response_data["status"]
                    }
                )

            # NEW PARTICIPANT UPDATE

            if is_new_participant:

                participants = await sync_to_async(
                    RoomService.get_all_room_participants
                )(
                    self.room_name
                )

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "participants_update",
                        "participants": participants
                    }
                )

            # DM NOTIFICATIONS

            if is_private:

                for participant_id in participant_ids:

                    if participant_id == self.user.id:
                        continue

                    await self.channel_layer.group_send(
                        f"user_{participant_id}",
                        {
                            "type": "dm_notification",
                            "room": self.room_name,
                            "message": msg_instance.content,
                            "sender": self.user.username
                        }
                    )

        except Exception as e:
            logger.error(f"Receive error: {e}")

    # =========================
    # SOCKET EVENTS
    # =========================

    async def chat_message(self, event):

        await self.send(text_data=json.dumps(
            event["data"]
        ))

    async def typing_event(self, event):

        await self.send(text_data=json.dumps({
            "type": "typing",
            "user": event["user"],
            "typing": event["typing"]
        }))

    async def online_users_update(self, event):

        await self.send(text_data=json.dumps({
            "type": "online_users_update",
            "online_users": event["online_users"]
        }))

    async def participants_update(self, event):

        await self.send(text_data=json.dumps({
            "type": "participants_update",
            "participants": event["participants"]
        }))

    async def message_status_updated(self, event):

        await self.send(text_data=json.dumps({
            "type": "message_status_updated",
            "message_id": event["message_id"],
            "status": event["status"],
            "seen_time_ago": event.get(
                "seen_time_ago"
            )
        }))

    async def message_status(self, event):

        await self.send(text_data=json.dumps({
            "type": "message_status",
            "message_id": event["message_id"],
            "status": event["status"]
        }))

    async def dm_notification(self, event):

        await self.send(text_data=json.dumps({
            "type": "dm_notification",
            "room": event["room"],
            "message": event["message"],
            "sender": event["sender"]
        }))