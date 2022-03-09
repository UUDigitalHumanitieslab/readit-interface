import requests
import time
import logging

from django.conf import settings

from rdflib import Graph, BNode, URIRef

from readit import celery_app
from ontology.fixture import replace_prefix
from items.graph import preannos_graph
from items.models import PreannotationCounter
from nlp_ontology.constants import NLP_NS, INSTANCE_NLP_NS

logger = logging.getLogger(__name__)


@celery_app.task
def poll_automated_annotations(job_id, timeout):
    url = '{}/datastore/{}/automated_annotation_result'.format(
        settings.IRISA_URL, job_id)
    headers = {
        'Accept': 'application/json',
        'Authorization': 'Token token={}'.format(settings.IRISA_TOKEN)
    }
    time.sleep(10)  # wait for ten seconds to make sure url exists
    waited = 10  # keep track of time waited in total
    while waited < timeout:
        result = requests.get(url, headers=headers)
        if result and result.text:
            g = Graph()
            g.parse(data=result.text, format='turtle')
            g = replace_bnodes(g)
            if NLP_NS != INSTANCE_NLP_NS:
                g = replace_prefix(g, NLP_NS, INSTANCE_NLP_NS)
            logger.info('Retrieved {} items from allgo18 server'.format(
                len(list(g.subjects()))))
            graph = preannos_graph()
            graph += g
            break
        else:
            waited += settings.IRISA_WAIT
            time.sleep(settings.IRISA_WAIT)


def replace_bnodes(graph):
    bnodes = {}
    output_graph = Graph()
    for s, p, o in graph:
        new_subject = None
        new_object = None
        if isinstance(s, BNode):
            if not s in bnodes.keys():
                bnodes[s] = generate_uri()
            new_subject = bnodes[s]
        if isinstance(o, BNode):
            if not o in bnodes.keys():
                bnodes[o] = generate_uri()
            new_object = bnodes[o]
        output_graph.add((new_subject or s, p, new_object or o))
    return output_graph


def generate_uri():
    counter = PreannotationCounter.current
    counter.increment()
    return URIRef(str(counter))
