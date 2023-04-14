import pytest
from items import namespace as item
from rdf.ns import FOAF, SCHEMA
from rdf.utils import graph_from_triples
from rdflib import Literal
from sparql_endpoints.conftest import sparql_client, sparql_user

from . import namespace as my
from .graph import graph


@pytest.fixture
def triples():
    return (
        (item.subject1, FOAF.name, Literal("Charles Baudelaire")),
        (item.subject2, FOAF.name, Literal("W.B. Yeats")),
        (item.subject1, SCHEMA.author, my.book1),
        (item.subject1, SCHEMA.creator, my.book1),
        (item.subject2, SCHEMA.creator, my.book2)
    )


@pytest.fixture
def exp_triples(triples):
    return (
        *triples[0:3],
        (item.subject2, SCHEMA.author, my.book2)
    )


@pytest.fixture
def sourcegraph(triples):
    return graph_from_triples(triples)


@pytest.fixture
def sourcegraphdb(sourcegraph, sparqlstore, db):
    g = graph()
    g += sourcegraph
    yield
    g -= sourcegraph
