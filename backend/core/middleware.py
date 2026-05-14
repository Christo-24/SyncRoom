from urllib.parse import parse_qs

from django.contrib.auth.models import (
    AnonymousUser,
    User,
)

from asgiref.sync import sync_to_async

from django.db import DatabaseError

from rest_framework_simplejwt.tokens import (
    AccessToken,
)

from rest_framework_simplejwt.tokens import (
    TokenError,
)

from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed,
    InvalidToken,
)

import logging

logger = logging.getLogger(__name__)

ANONYMOUS_USER = AnonymousUser()

INVALID_TOKEN_VALUES = {
    '',
    'null',
    'none',
    'undefined',
}


@sync_to_async(
    thread_sensitive=False
)
def get_user(user_id):

    try:

        return User.objects.get(
            id=user_id
        )

    except (
        User.DoesNotExist,
        DatabaseError,
    ):

        return ANONYMOUS_USER


class JWTAuthMiddleware:

    def __init__(self, inner):

        self.inner = inner

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):

        try:

            query_string = (
                scope.get(
                    'query_string',
                    b''
                ).decode()
            )

        except (
            AttributeError,
            UnicodeDecodeError,
        ):

            scope['user'] = (
                ANONYMOUS_USER
            )

            return await self.inner(
                scope,
                receive,
                send,
            )

        query_params = parse_qs(
            query_string
        )

        token_list = (
            query_params.get(
                'token',
                []
            )
        )

        token = (
            token_list[0].strip()
            if token_list
            else ''
        )

        if (
            token.lower()
            not in INVALID_TOKEN_VALUES
        ):

            try:

                access_token = (
                    AccessToken(token)
                )

                user_id = (
                    access_token.get(
                        'user_id'
                    )
                )

                if user_id:

                    scope['user'] = (
                        await get_user(
                            user_id
                        )
                    )

                else:

                    scope['user'] = (
                        ANONYMOUS_USER
                    )

            except (
                TokenError,
                InvalidToken,
                AuthenticationFailed,
            ):

                scope['user'] = (
                    ANONYMOUS_USER
                )

            except Exception as e:

                logger.error(
                    f'JWT middleware error: {str(e)}'
                )

                scope['user'] = (
                    ANONYMOUS_USER
                )

        else:

            scope['user'] = (
                ANONYMOUS_USER
            )

        return await self.inner(
            scope,
            receive,
            send,
        )