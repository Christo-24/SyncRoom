import redis
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check Redis connectivity and configuration'

    def handle(self, *args, **options):
        """Test Redis connection and display configuration"""
        
        # Get Redis configuration from settings
        channel_config = settings.CHANNEL_LAYERS['default']['CONFIG']
        redis_host, redis_port = channel_config['hosts'][0]
        
        self.stdout.write(f"\n🔍 Testing Redis Connection...")
        self.stdout.write(f"   Host: {redis_host}")
        self.stdout.write(f"   Port: {redis_port}")
        
        try:
            # Test connection to Redis
            r = redis.Redis(host=redis_host, port=int(redis_port), socket_connect_timeout=5, decode_responses=True)
            response = r.ping()
            
            if response:
                self.stdout.write(self.style.SUCCESS(f'✓ Redis is connected and responding!'))
                self.stdout.write(f'   Response: {response}')
                
                # Get Redis info
                info = r.info()
                self.stdout.write(f'\n📊 Redis Server Info:')
                self.stdout.write(f'   Version: {info.get("redis_version", "N/A")}')
                self.stdout.write(f'   Used Memory: {info.get("used_memory_human", "N/A")}')
                self.stdout.write(f'   Connected Clients: {info.get("connected_clients", "N/A")}')
                
                logger.info(f"✓ Redis connection successful: {redis_host}:{redis_port}")
                return
                
        except redis.ConnectionError as e:
            error_msg = f"❌ Cannot connect to Redis at {redis_host}:{redis_port}\n   Error: {str(e)}"
            self.stdout.write(self.style.ERROR(error_msg))
            logger.error(error_msg)
            raise CommandError(error_msg)
            
        except redis.TimeoutError:
            error_msg = f"❌ Redis connection timed out at {redis_host}:{redis_port}"
            self.stdout.write(self.style.ERROR(error_msg))
            logger.error(error_msg)
            raise CommandError(error_msg)
            
        except Exception as e:
            error_msg = f"❌ Unexpected error connecting to Redis: {str(e)}"
            self.stdout.write(self.style.ERROR(error_msg))
            logger.error(error_msg)
            raise CommandError(error_msg)
