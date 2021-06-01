import os
from celery import Celery


# set the Django settings module for the 'celery' program.
# if no environment variable is set yet, set it to the settings next to this file.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.environ.get(
    'DJANGO_SETTINGS_MODULE', 'readit.settings'))

app = Celery('readit')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
