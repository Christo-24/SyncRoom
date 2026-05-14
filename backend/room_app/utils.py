from django.contrib.auth.models import AnonymousUser


def is_valid_user(user):

    is_anonymous = isinstance(
        user,
        AnonymousUser
    )

    is_authenticated = getattr(
        user,
        "is_authenticated",
        False
    )

    return (
        not is_anonymous
        and is_authenticated
    )