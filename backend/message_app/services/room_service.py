from room_app.models import Room


class RoomService:

    @staticmethod
    def get_room_by_name(room_name):
        return Room.objects.filter(name__iexact=room_name).first()

    @staticmethod
    def room_exists(room_name):
        return RoomService.get_room_by_name(room_name) is not None

    @staticmethod
    def get_canonical_room_name(room_name):
        room = RoomService.get_room_by_name(room_name)
        return room.name if room else None

    @staticmethod
    def user_has_access(room_name, user):
        room = RoomService.get_room_by_name(room_name)

        if room is None:
            return False

        if not room.is_private:
            return True

        return room.participants.filter(id=user.id).exists()

    @staticmethod
    def get_all_room_participants(room_name):

        room = RoomService.get_room_by_name(room_name)

        if room is None:
            return []

        return [
            {
                "id": participant.id,
                "username": participant.username
            }
            for participant in room.participants.all()
        ]