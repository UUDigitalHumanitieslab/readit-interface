from django.contrib.auth import get_user_model

from rdf.ns import *

from . import namespace as my
from .graph import graph

from .views import SourceHighlights

from .tasks import replace_bnodes


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


def test_replace_bnodes(item_counter):
    test_output = '@prefix ns1: <http://www.w3.org/ns/oa#> .\n@prefix ns2: <http://www.w3.org/ns/activitystreams#> .\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n\n[] a ns1:Annotation ;\n    ns2:generator <https://allgo18.inria.fr/apps/read_it_test> ;\n    ns1:hasBody <https://read-it.hum.uu.nl/nlp-ontology#person> ;\n    ns1:hasTarget [ a ns1:SpecificResource ;\n            ns1:hasSelector [ a ns1:TextPositionSelector ;\n                    ns1:end 233 ;\n                    ns1:start 220 ],\n                [ a ns1:TextQuoteSelector ;\n                    ns1:exact "Bilbo Baggins" ;\n                    ns1:prefix "everyday deeds of ordinary folk that keep the darkness at bay. Small acts of kindness and love. Why " ;\n                    ns1:suffix "? Perhaps because I am afraid, and he gives me courage." ] ;\n            ns1:hasSource <readit-test.url/source/42> ] .\n\n[] a ns1:Annotation ;\n    ns2:generator <https://allgo18.inria.fr/apps/read_it_test> ;\n    ns1:hasBody <https://read-it.hum.uu.nl/nlp-ontology#person> ;\n    ns1:hasTarget [ a ns1:SpecificResource ;\n            ns1:hasSelector [ a ns1:TextQuoteSelector ;\n                    ns1:exact "Saruman" ;\n                    ns1:prefix "" ;\n                    ns1:suffix " believes it is only great power that can hold evil in check, but that is not what I have found. It " ],\n                [ a ns1:TextPositionSelector ;\n                    ns1:end 7 ;\n                    ns1:start 0 ] ;\n            ns1:hasSource <readit-test.url/source/42> ] .\n\n\n'
