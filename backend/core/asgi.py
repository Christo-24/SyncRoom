import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from core.middleware import JWTAuthMiddleware
import message_app.routing
import room_app.routing

# Combine WebSocket URL patterns
websocket_patterns = message_app.routing.websocket_urlpatterns + room_app.routing.websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(
                websocket_patterns
            )
        )
    ),
})