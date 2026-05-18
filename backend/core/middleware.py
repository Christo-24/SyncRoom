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

        path = scope.get('path', '')
        headers = dict(scope.get('headers', []))
        origin = headers.get(b'origin', b'').decode(errors='ignore')

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

        if not token_list:
            token_list = (
                query_params.get(
                    'access',
                    []
                )
            )

        if not token_list:
            token_list = (
                query_params.get(
                    'access_token',
                    []
                )
            )

        token = (
            token_list[0].strip()
            if token_list
            else ''
        )

        logger.info(
            "WS auth start: path=%s origin=%s token_present=%s token_len=%s",
            path,
            origin,
            bool(token),
            len(token),
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

                    logger.info(
                        "WS auth success: path=%s user_id=%s authenticated=%s",
                        path,
                        user_id,
                        getattr(scope['user'], 'is_authenticated', False),
                    )

                else:

                    scope['user'] = (
                        ANONYMOUS_USER
                    )

                    logger.warning(
                        "WS auth failed (no user_id claim): path=%s",
                        path,
                    )

            except (
                TokenError,
                InvalidToken,
                AuthenticationFailed,
            ) as auth_err:

                scope['user'] = (
                    ANONYMOUS_USER
                )

                logger.warning(
                    "WS auth token invalid: path=%s error=%s",
                    path,
                    str(auth_err),
                )

            except Exception as e:

                logger.error(
                    'JWT middleware error: path=%s error=%s',
                    path,
                    str(e),
                )

                scope['user'] = (
                    ANONYMOUS_USER
                )

        else:

            scope['user'] = (
                ANONYMOUS_USER
            )

            logger.warning(
                "WS auth missing/invalid token value: path=%s",
                path,
            )

        return await self.inner(
            scope,
            receive,
            send,
        )