import pytest
from rdflib import Literal

from rdf.ns import RDF, SCHEMA
from rdf.utils import graph_from_triples

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
