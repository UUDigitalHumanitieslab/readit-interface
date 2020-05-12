from rdflib import Graph

QUERY_URL = '/nlp-ontology'
UPDATE_URL = QUERY_URL + '/update'

INSERT_QUERY = '''
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX my: <http://testserver/nlp-ontology#>
    PREFIX dctypes: <http://purl.org/dc/dcmitype/>
    PREFIX ns3: <http://schema.org/>

    INSERT DATA { 
        my:icecream         a               ns3:Food        ;
                            ns3:color       "#f9e5bc"       .
        ns3:Cat             my:meow         "loud"          .
    }
'''

SELECT_QUERY = '''
    SELECT ?s ?p ?o
    WHERE {
        ?s ?p ?o .
    }
'''


def test_insert(admin_client, ontologygraph):
    post_response = admin_client.post(UPDATE_URL, {'update': INSERT_QUERY})
    assert post_response.status_code == 200

    get_response = admin_client.get(QUERY_URL)
    assert post_response.status_code == 200
    get_data = Graph()
    get_data.parse(data=get_response.content, format='turtle')

    assert len(ontologygraph ^ get_data) == 0


def test_authorized(admin_client):
    response = admin_client.post(UPDATE_URL, {'update': INSERT_QUERY})
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
