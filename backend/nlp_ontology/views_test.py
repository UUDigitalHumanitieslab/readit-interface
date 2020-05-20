from rdflib import Graph
import json

QUERY_URL = '/nlp-ontology'
UPDATE_URL = QUERY_URL + '/update'


def test_insert(admin_client, ontologygraph, test_queries):
    post_response = admin_client.post(
        UPDATE_URL, {'update': test_queries.INSERT})
    assert post_response.status_code == 200

    get_response = admin_client.get(QUERY_URL)
    assert post_response.status_code == 200
    get_data = Graph()
    get_data.parse(data=get_response.content, format='turtle')

    assert len(ontologygraph ^ get_data) == 0


def test_ask(client, test_queries, ontologygraph_db):
    true_response = client.get(
        QUERY_URL, {'query': test_queries.ASK_TRUE})
    assert true_response.status_code == 200
    assert json.loads(true_response.content)['boolean']

    false_response = client.get(
        QUERY_URL, {'query': test_queries.ASK_FALSE})
    assert false_response.status_code == 200
    assert not json.loads(false_response.content)['boolean']


def test_describe(client, test_queries, ontologygraph_db):
    # DESCRIBE queries are not implemented in rdflib
    response = client.get(QUERY_URL, {'query': test_queries.DESCRIBE})
    assert response.status_code == 500


def test_construct(client, test_queries, ontologygraph_db):
    # TODO: proper test
    response = client.get(QUERY_URL, {'query': test_queries.CONSTRUCT})
    assert response.status_code == 200


def test_authorized(admin_client, test_queries):
    response = admin_client.post(UPDATE_URL, {'update': test_queries.INSERT})
    assert response.status_code == 200


def test_unauthorized(client):
    response = client.post(UPDATE_URL)
    assert response.status_code == 403


def test_malformed_update(admin_client):
    response = admin_client.post(
        UPDATE_URL, {'update': 'this is no SPARQL update!'})
    assert response.status_code == 400


def test_malformed_query(client):
    response = client.post(QUERY_URL, {'query': 'this is no SPARQL query!'})
    assert response.status_code == 400
