from room_app.models import Room


class RoomService:

    @staticmethod
    def room_exists(room_name):
        return Room.objects.filter(name=room_name).exists()

    @staticmethod
    def user_has_access(room_name, user):
        try:
            room = Room.objects.get(name=room_name)

            if not room.is_private:
                return True

            return room.participants.filter(id=user.id).exists()

        except Room.DoesNotExist:
            return False

    @staticmethod
    def get_all_room_participants(room_name):

        try:
            room = Room.objects.get(name=room_name)

            return [
                {
                    "id": participant.id,
                    "username": participant.username
                }
                for participant in room.participants.all()
            ]

        except Room.DoesNotExist:
            return []