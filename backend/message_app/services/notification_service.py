class NotificationService:

    @staticmethod
    async def send_typing(channel_layer, room_group_name, username, typing):

        await channel_layer.group_send(
            room_group_name,
            {
                "type": "typing_event",
                "user": username,
                "typing": typing
            }
        )

    @staticmethod
    async def send_message_status(
        channel_layer,
        room_group_name,
        message_id,
        status,
        seen_time_ago=None
    ):

        await channel_layer.group_send(
            room_group_name,
            {
                "type": "message_status_updated",
                "message_id": message_id,
                "status": status,
                "seen_time_ago": seen_time_ago
            }
        )