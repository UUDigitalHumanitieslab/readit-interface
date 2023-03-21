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
def super_credentials():
    return 'admin', 'is the boss'


@pytest.fixture
def auth_client(client, django_user_model, credentials):
    username, password = credentials
    django_user_model.objects.create_user(username=username, password=password)
    client.login(username=username, password=password)
    yield client
    client.logout()
    django_user_model.objects.get(username=username).delete()


@pytest.fixture
def super_client(client, django_user_model, super_credentials):
    username, password = super_credentials
    django_user_model.objects.create_superuser(
        username=username, password=password
    )
    client.login(username=username, password=password)
    yield client
    client.logout()
    django_user_model.objects.get(username=username).delete()


@pytest.fixture
def sparqlstore(settings):
    store = settings.RDFLIB_STORE
    assert not store.query(HAS_TRIPLES)
    yield store
    store.update('CLEAR ALL')


@pytest.fixture
def es_index_name():
    return 'readit-test'


@pytest.fixture
def es_client(settings, es_index_name):
    from elasticsearch import Elasticsearch
    from elasticsearch.client import IndicesClient
    es = Elasticsearch(
        hosts=[{'host': settings.ES_HOST, 'port': settings.ES_PORT}])
    ind_client = IndicesClient(es)
    ind_client.create(index=es_index_name)
    yield es
    ind_client.delete(index=es_index_name)
