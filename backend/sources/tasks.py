import requests
import time

from django.conf import settings

from rdflib import Graph

from readit import celery_app
from items import graph as item_graph
from items.views import replace_bnodes

@celery_app.task
def poll_automated_annotations(job_id, timeout):
    url = '{}/datastore/{}/automated_annotation_result'.format(settings.IRISA_URL, job_id)
    headers = {
        'Accept': 'application/json',
        'Authorization': 'Token token={}'.format(settings.IRISA_TOKEN)
    }
    waited = 0
    time.sleep(10) # wait for ten seconds to make sure url exists
    while waited < timeout:
        result = requests.get(url, headers=headers)
        if result and result.text:
            g = Graph()
            g.parse(data=result.text, format='turtle')
            result, new_subject = replace_bnodes(g)
            item_graph = item_graph()
            item_graph += result
            break
        else:
            waited += settings.IRISA_WAIT
            time.sleep(settings.IRISA_WAIT)
