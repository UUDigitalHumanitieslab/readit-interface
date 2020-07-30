from django.contrib.auth import get_user_model

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


def test_delete_source(auth_client, credentials):
    name, pwd = credentials
    User = get_user_model()
    user = User.objects.get(username=name)
    user.is_superuser = True
    user.save()
    test_triple = (my['1'], OWL.sameAs, my['1'])
    sources = graph()
    sources.add(test_triple)
    response = auth_client.delete('/source/1')
    assert response.status_code == 200
    assert test_triple not in sources
