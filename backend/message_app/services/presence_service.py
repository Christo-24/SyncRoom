import json

from django.core.cache import cache


class PresenceService:

    @staticmethod
    def add_online_user(key, username):

        try:
            cached_data = cache.get(key)

            if cached_data is None:
                users = []

            elif isinstance(cached_data, str):
                users = json.loads(cached_data)

            else:
                users = (
                    list(cached_data)
                    if hasattr(cached_data, "__iter__")
                    else []
                )

            if username not in users:
                users.append(username)
                users.sort()

            cache.set(
                key,
                json.dumps(users),
                300
            )

        except Exception:
            cache.set(
                key,
                json.dumps([username]),
                300
            )

    @staticmethod
    def remove_online_user(key, username):

        try:
            cached_data = cache.get(key)

            if cached_data is None:
                return

            if isinstance(cached_data, str):
                users = json.loads(cached_data)

            else:
                users = (
                    list(cached_data)
                    if hasattr(cached_data, "__iter__")
                    else []
                )

            users = [
                user
                for user in users
                if user != username
            ]

            if users:
                cache.set(
                    key,
                    json.dumps(users),
                    300
                )

            else:
                cache.delete(key)

        except Exception:
            cache.delete(key)

    @staticmethod
    def get_online_users(key):

        try:
            cached_data = cache.get(key)

            if cached_data is None:
                return []

            if isinstance(cached_data, str):
                users = json.loads(cached_data)

            else:
                users = (
                    list(cached_data)
                    if hasattr(cached_data, "__iter__")
                    else []
                )

            return sorted(users)

        except Exception:
            return []