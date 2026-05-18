import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from .utils import is_valid_user
from .constants import ROOMS_GROUP
from django.core.cache import cache

from message_app.services.presence_service import PresenceService
import asyncio

logger = logging.getLogger(__name__)


class RoomGroupConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        try:

            self.user = self.scope['user']

            if not is_valid_user(self.user):
                await self.close(code=4401)
                return

            self.room_group_name = ROOMS_GROUP

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()

            await self.send(text_data=json.dumps({
                'type': 'connected',
                'message': 'Connected to room updates'
            }))

        except Exception as e:
            logger.error(f"RoomGroup connect error: {e}")

    async def disconnect(self, close_code):

        try:

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        except Exception as e:
            logger.error(f"RoomGroup disconnect error: {e}")

    async def room_created(self, event):

        await self.send(text_data=json.dumps({
            'type': 'room_created',
            'room': event['room']
        }))


class UserNotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        try:

            self.user = self.scope['user']
            path = self.scope.get('path', '')

            if not is_valid_user(self.user):
                logger.warning(
                    "Notification WS reject unauthenticated: path=%s",
                    path,
                )
                await self.close(code=4401)
                return

            self.user_group_name = (
                f'user_{self.user.id}'
            )

            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )

            await self.accept()

            await self.send(text_data=json.dumps({
                'type': 'connected',
                'message': 'Connected to notifications'
            }))

            # PRESENCE: add this connection to user's presence set
            try:
                username = self.user.username
                conn_key = f"presence_conns_{username}"

                cached = cache.get(conn_key)

                if cached is None:
                    conns = []
                elif isinstance(cached, str):
                    conns = json.loads(cached)
                else:
                    conns = list(cached) if hasattr(cached, "__iter__") else []

                first_connection = len(conns) == 0

                if self.channel_name not in conns:
                    conns.append(self.channel_name)

                cache.set(conn_key, json.dumps(conns), 300)

                # add to global presence group so all notification sockets receive updates
                await self.channel_layer.group_add("presence", self.channel_name)

                if first_connection:
                    global_key = "global_online_users"
                    await sync_to_async(PresenceService.add_online_user)(global_key, username)
                    # broadcast user_online to presence group
                    await self.channel_layer.group_send(
                        "presence",
                        {
                            "type": "presence_event",
                            "event": "user_online",
                            "username": username,
                            "user_id": self.user.id,
                        },
                    )

                # send initial presence snapshot to this client
                online = await sync_to_async(PresenceService.get_online_users)("global_online_users")

                await self.send(text_data=json.dumps({
                    "type": "presence_init",
                    "online_users": online,
                }))

            except Exception:
                pass

        except Exception as e:
            logger.error(
                f"Notification connect error: {e}"
            )

    async def disconnect(self, close_code):

        try:

            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

            # PRESENCE: remove this connection; only mark offline when no remaining conns
            try:
                username = self.user.username
                conn_key = f"presence_conns_{username}"

                cached = cache.get(conn_key)

                if cached is None:
                    conns = []
                elif isinstance(cached, str):
                    conns = json.loads(cached)
                else:
                    conns = list(cached) if hasattr(cached, "__iter__") else []

                conns = [c for c in conns if c != self.channel_name]

                cache.set(conn_key, json.dumps(conns), 300)

                # short debounce before declaring offline to avoid reconnect flapping
                await asyncio.sleep(1)

                cached_after = cache.get(conn_key)

                if cached_after is None:
                    conns_after = []
                elif isinstance(cached_after, str):
                    conns_after = json.loads(cached_after)
                else:
                    conns_after = list(cached_after) if hasattr(cached_after, "__iter__") else []

                if len(conns_after) == 0:
                    global_key = "global_online_users"
                    await sync_to_async(PresenceService.remove_online_user)(global_key, username)

                    await self.channel_layer.group_send(
                        "presence",
                        {
                            "type": "presence_event",
                            "event": "user_offline",
                            "username": username,
                            "user_id": self.user.id,
                        },
                    )

                # ensure we leave presence group
                await self.channel_layer.group_discard("presence", self.channel_name)

            except Exception:
                pass

        except Exception as e:
            logger.error(
                f"Notification disconnect error: {e}"
            )

    async def presence_event(self, event):

        evt = event.get("event")

        if evt == "user_online":
            await self.send(text_data=json.dumps({
                "type": "user_online",
                "username": event.get("username"),
                "user_id": event.get("user_id"),
            }))

        elif evt == "user_offline":
            await self.send(text_data=json.dumps({
                "type": "user_offline",
                "username": event.get("username"),
                "user_id": event.get("user_id"),
            }))

    async def dm_created(self, event):

        await self.send(text_data=json.dumps({
            'type': 'dm_created',
            'dm': event['dm']
        }))

    async def dm_message_notification(self, event):

        await self.send(text_data=json.dumps({
            'type': 'dm_message_notification',
            'room_name': event['room_name'],
            'sender': event['sender'],
            'message': event['message']
        }))