from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlencode

from rdflib import Literal, Graph, BNode, URIRef

from rdf.ns import *
from staff import namespace as STAFF
from ontology import namespace as ONTO
from . import namespace as ITEM
from .constants import ITEMS_ROUTE
from .views import *
from .graph import graph

QUERY_PATTERN = '/{}?'.format(ITEMS_ROUTE) + '{}'


def test_is_unreserved():
    assert     is_unreserved((None, SCHEMA.CreativeWork, None))
    assert     is_unreserved((None, SCHEMA.author, None))
    assert     is_unreserved((None, SCHEMA.datePublished, None))
    assert     is_unreserved((None, SCHEMA.name, None))
    assert     is_unreserved((None, OA.Annotation, None))
    assert     is_unreserved((None, OA.prefix, None))
    assert     is_unreserved((None, OA.RangeSelector, None))
    assert     is_unreserved((None, RDF.type, None))
    assert     is_unreserved((None, RDF.value, None))
    assert     is_unreserved((None, DCTERMS.abstract, None))
    assert     is_unreserved((None, DCTERMS.alternative, None))
    assert     is_unreserved((None, DCTERMS.isPartOf, None))
    assert     is_unreserved((None, DCTERMS.isReferencedBy, None))
    assert     is_unreserved((None, DCTERMS.tableOfContents, None))
    assert not is_unreserved((None, DCTERMS.created, None))
    assert not is_unreserved((None, DCTERMS.creator, None))
    assert not is_unreserved((None, DCTERMS.identifier, None))
    assert not is_unreserved((None, DCTERMS.modified, None))
    assert not is_unreserved((None, DCTERMS.relation, None))
    assert not is_unreserved((None, DCTERMS.type, None))


def test_sanitize(itemgraph):
    s = sanitize(itemgraph)
    assert ( ITEM['1'], RDF.type, OA.TextQuoteSelector )                  in s
    assert ( ITEM['1'], OA.prefix, Literal('this is the start of ') )     in s
    assert ( ITEM['6'], SKOS.prefLabel, Literal('Margaret Blessington') ) in s
    assert ( ITEM['6'], ONTO.has_gender, Literal('female') )              in s
    assert ( ITEM['6'], CIDOC.was_born, Literal(date(1789, 9, 1)) )       in s
    assert ( ITEM['7'], OA.motivatedBy, OA.tagging )                      in s
    assert ( ITEM['1'], DCTERMS.creator, STAFF.AHebing )              not in s
    assert ( ITEM['6'], DCTERMS.type, Literal('example data') )       not in s


def test_get_item_root(client, itemgraph_db):
    response = client.get('/' + ITEMS_ROUTE)
    data = Graph()
    data.parse(data=response.content, format='turtle')
    assert len(data) == 0


def test_get_item_query(client, itemgraph_db):
    query = urlencode({
        'p': str(RDF.type),
        'o': str(OA.TextPositionSelector),
    })
    response = client.get(QUERY_PATTERN.format(query))
    data = Graph()
    data.parse(data=response.content, format='turtle')
    assert len(data) == 5
    subjects = set(data.subjects())
    assert ITEM['1'] not in subjects
    assert ITEM['4']     in subjects
    for serial in range(5, 8):
        assert ITEM[str(serial)] not in subjects


def submit_data(client, input_graph, method, serial=None):
    """ Send some item data to the backend to work with. """
    url = '/' + ITEMS_ROUTE + (str(serial) if serial else '')
    plaintext = input_graph.serialize(format='json-ld')
    response = getattr(client, method)(url, plaintext, 'application/ld+json')
    output_graph = Graph()
    output_graph.parse(data=response.content, format='turtle')
    return response, output_graph


def test_post_item(auth_client, sparqlstore):
    bnode = BNode()
    muppet = URIRef('https://muppets.disney.com/')
    pork = URIRef('https://en.wikipedia.org/wiki/Pork')
    triples = (
        ( bnode, RDF.type, muppet ),
        ( bnode, FOAF.name, Literal('Kermit the Frog') ),
        ( bnode, FOAF.interest, pork ),
        ( bnode, DCTERMS.creator, STAFF.Statler ),
    )
    input_graph = Graph()
    for t in triples:
        input_graph.add(t)
    response, output_graph = submit_data(auth_client, input_graph, 'post')
    assert len(output_graph) == 5
    subjects = set(output_graph.subjects())
    assert len(subjects) == 1
    s = subjects.pop()
    assert ( s, RDF.type, muppet ) in output_graph
    assert ( s, FOAF.name, Literal('Kermit the Frog') ) in output_graph
    assert ( s, FOAF.interest, pork ) in output_graph
    assert ( s, DCTERMS.creator, STAFF.tester ) in output_graph
    assert ( s, DCTERMS.creator, STAFF.Statler ) not in output_graph
    created = next(output_graph.objects(s, DCTERMS.created)).toPython()
    assert abs(created - datetime.now(timezone.utc)) < timedelta(seconds=1)


def test_put_item(auth_client, itemgraph_db):
    g = graph()
    before = 22
    after = 21
    triples = (
        ( ITEM['4'], RDF.type, OA.TextPositionSelector ),
        ( ITEM['4'], OA.start, Literal(after)          ),
        ( ITEM['4'], OA.end,   Literal(41)             ),
    )
    input_graph = Graph()
    for t in triples:
        input_graph.add(t)
    assert (ITEM['4'], OA.start, Literal(before)) in g
    assert (ITEM['4'], OA.start, Literal(after)) not in g
    response, output_graph = submit_data(auth_client, input_graph, 'put', 4)
    assert len(output_graph) == 5
    assert (ITEM['4'], OA.start, Literal(before)) not in output_graph
    assert (ITEM['4'], OA.start, Literal(after)) in output_graph
    assert (ITEM['4'], OA.start, Literal(before)) not in g
    assert (ITEM['4'], OA.start, Literal(after)) in g


def test_delete_item(auth_client, itemgraph_db):
    response, output_graph = submit_data(auth_client, Graph(), 'delete', 1)
    assert len(output_graph) == 6
    assert (ITEM['1'], RDF.type, OA.TextQuoteSelector) in output_graph
    assert len(set(graph().triples((ITEM['1'], None, None)))) == 0

    response, _ = submit_data(auth_client, Graph(), 'delete', 36)
    assert response.status_code == 404


def test_delete_item_super(super_client, itemgraph_db):
    response, output_graph = submit_data(super_client, Graph(), 'delete', 1)
    assert len(output_graph) == 6
    assert (ITEM['1'], RDF.type, OA.TextQuoteSelector) in output_graph
    assert len(set(graph().triples((ITEM['1'], None, None)))) == 0

    response, _ = submit_data(super_client, Graph(), 'delete', 36)
    assert response.status_code == 404


def test_blanknodes_post(auth_client, sparqlstore):
    triple = (BNode(), RDF.type, BNode())
    input_graph = Graph()
    input_graph.add(triple)
    response, output_graph = submit_data(auth_client, input_graph, 'post')

    assert response.status_code == 400
    assert (None, None, Literal(BLANK_OBJECT_PREDICATE_400)) in output_graph


def test_blanknodes_put(auth_client, sparqlstore):
    g = graph()
    g.add((ITEM['42'], RDF.type, Literal("Icecream")))

    override = Graph()
    override.add((ITEM['42'], RDF.type, BNode()))
    response, output_graph = submit_data(auth_client, override, 'put', 42)
    assert response.status_code == 400
    assert (None, None, Literal(BLANK_OBJECT_PREDICATE_400)) in output_graph
