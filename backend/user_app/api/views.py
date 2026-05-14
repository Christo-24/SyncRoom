from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User

from .serializer import RegisterSerializer, UserSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(f"Token error: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user - No authentication required"""
    if request.method == 'POST':
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'id': user.id,
                'username': user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterAPIView(APIView):
    # FIXED: Allow unauthenticated users to register (override default IsAuthenticated)
    permission_classes = [AllowAny]
    
    def dispatch(self, request, *args, **kwargs):
        # Explicitly set permissions before processing request
        self.permission_classes = [AllowAny]
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                'id': user.id,
                'username': user.username,
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user info"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """Get list of all users except current user"""
    users = User.objects.exclude(id=request.user.id)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
