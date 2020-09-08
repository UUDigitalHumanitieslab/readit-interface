import pytest

HAS_TRIPLES = '''
ASK {
    GRAPH ?g {
        ?s ?p ?o
    }
}
'''


@pytest.fixture
def credentials():
    return 'tester', 'testing123'


@pytest.fixture
def auth_client(client, django_user_model, credentials):
    username, password = credentials
    django_user_model.objects.create_user(username=username, password=password)
    client.login(username=username, password=password)
    yield client
    client.logout()
    django_user_model.objects.get(username=username).delete()


@pytest.fixture
def sparqlstore(settings):
    store = settings.RDFLIB_STORE
    store.update('CLEAR ALL')
    assert not store.query(HAS_TRIPLES)
    yield store
    store.update('CLEAR ALL')
