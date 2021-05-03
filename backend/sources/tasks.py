import requests
import time

from django.conf import settings

from rdflib import Graph, BNode, URIRef

from readit import celery_app
from items import graph as item_graph
from items.models import ItemCounter

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
            result_graph = replace_bnodes(g)
            item_graph = item_graph()
            item_graph += result_graph
            break
        else:
            waited += settings.IRISA_WAIT
            time.sleep(settings.IRISA_WAIT)

def replace_bnodes(graph):
    bnodes = {}
    output_graph = Graph()
    counter = ItemCounter.current
    for s, p, o in graph:
        new_subject = None
        new_object = None
        if isinstance(s, BNode):
            if not s in bnodes.keys():
                counter.increment()
                bnodes[s] = URIRef(str(counter))
            new_subject = bnodes[s]
        if isinstance(o, BNode):
            if not o in bnodes.keys():
                counter.increment()
                bnodes[s] = URIRef(str(counter))
            new_object = bnodes[s]
        output_graph.add((new_subject or s, p, new_object or o))
    return output_graph



