
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', include('user_app.api.urls')),
    path('api/room/', include('room_app.api.urls')),
    path('api/messages/', include('message_app.api.urls')),
]
