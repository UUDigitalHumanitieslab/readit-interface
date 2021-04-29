import requests
import time

from django.conf import settings

from rdflib import Graph

from readit import celery_app
from items import graph as item_graph

@celery_app.task
def poll_automated_annotations(job_id, timeout):
    url = '{}/datastore/{}/automated_annotation_result'.format(settings.IRISA_URL, job_id)
    headers = {
        'Accept': 'application/json',
        'Authorization': 'Token token={}'.format(settings.IRISA_TOKEN)
    }
    waited = 0
    while waited < timeout:
        result = requests.get(url, headers=headers)
        print(url, headers, result.text)
        if result:
            g = Graph()
            g.parse(result.text, format='turtle')
            item_graph = item_graph()
            item_graph += g
            print("success")
            break
        else:
            waited += settings.IRISA_WAIT
            print(waited)
            time.sleep(settings.IRISA_WAIT)
