from django.urls import re_path
from .consumers import RoomGroupConsumer, UserNotificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/rooms/$', RoomGroupConsumer.as_asgi()),
    re_path(r'ws/notifications/$', UserNotificationConsumer.as_asgi()),
]
