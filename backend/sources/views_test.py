from django.contrib.auth import get_user_model
from django.conf import settings

from rdf.ns import *

from . import namespace as my
from .graph import graph

from .views import SourceHighlights


def test_delete_source_unauthorized(auth_client, sparqlstore):
    test_triple = (my['1'], OWL.sameAs, my['1'])
    sources = graph()
    sources.add(test_triple)
    response = auth_client.delete('/source/1')
    assert response.status_code == 403
    assert test_triple in sources


def test_delete_source(auth_client, credentials, sparqlstore):
    name, pwd = credentials
    User = get_user_model()
    user = User.objects.get(username=name)
    user.is_superuser = True
    user.save()
    test_triple = (my['1'], OWL.sameAs, my['1'])
    sources = graph()
    sources.add(test_triple)
    response = auth_client.delete('/source/1')
    assert response.status_code == 204
    assert test_triple not in sources


def test_highlight_body(es_client, es_index_name):
    es_client.create(es_index_name, id=42, body={
        'id': 42,
        'title': 'The answer to everything',
        'author': 'Douglas Adams',
        'text': 'The question is: what is the question?'
    }, refresh=True)
    hl = SourceHighlights()
    serial = 42
    query = 'answer'
    fields = 'all'
    body = hl.construct_es_body(serial, query, fields)
    results = es_client.search(index=es_index_name, body=body)
    assert len(results['hits']['hits'])
    assert 'highlight' in results['hits']['hits'][0]


def test_irisa_token():
    """ This test is expected to fail with default settings """
    assert settings.IRISA_TOKEN != None
