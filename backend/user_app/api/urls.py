from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register, current_user, users_list, CustomTokenObtainPairView

urlpatterns = [
    path('register/', register),  # FIXED: Use function-based view for registration
    path('token/', CustomTokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('me/', current_user),
    path('users/', users_list),
]