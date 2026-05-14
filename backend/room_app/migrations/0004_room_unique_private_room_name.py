# Generated migration to add unique constraint for DM room names
# This prevents duplicate DM rooms during concurrent creation

from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('room_app', '0003_alter_room_options_alter_room_created_at_and_more'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='room',
            constraint=models.UniqueConstraint(
                condition=Q(('is_private', True)),
                fields=('name', 'is_private'),
                name='unique_private_room_name'
            ),
        ),
    ]
