from rdf.ns import *

from . import namespace as my
from .graph import graph


def test_delete_source_unauthorized(auth_client):
    test_triple = (my['1'], OWL.sameAs, my['1'])
    sources = graph()
    sources.add(test_triple)
    response = auth_client.delete('/source/1')
    assert response.status_code == 403
    assert test_triple in sources
