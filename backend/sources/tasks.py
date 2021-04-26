import requests
import time

from django.conf import settings
from readit import celery_app

@celery_app.task
def poll_automated_annotations(job_id, timeout):
    url = '{}/{}/automated_annotation_result'.format(settings.IRISA_URL, job_id)
    headers = {
        'Accept': 'application/json',
        'Authorization': 'Token token={}'.format(settings.IRISA_TOKEN)
    }
    waited = 0
    while waited < timeout:
        result = requests.get(url, headers=headers)
        if result:
            print(result.text)
            break
        else:
            waited += settings.IRISA_WAIT
            time.sleep(settings.IRISA_WAIT)
