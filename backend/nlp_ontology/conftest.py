import pytest
from rdflib import Graph, Literal

from rdf.ns import DCTYPES, RDF, RDFS, SCHEMA

from . import namespace as my

TRIPLES = (
    (my.icecream,   RDF.type,       SCHEMA.Food),
    (my.icecream,   SCHEMA.color,   Literal("#f9e5bc")),
    (SCHEMA.Cat,    my.meow,        Literal('loud')),
)


@pytest.fixture
def ontologygraph():
    g = graph_from_triples(TRIPLES)
    return g
