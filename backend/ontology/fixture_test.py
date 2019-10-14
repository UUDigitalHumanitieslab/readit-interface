from rdflib import Graph, Literal

from rdf.ns import *

from .constants import *
from .fixture import *


def graph_with_prefix(prefix):
    my = Namespace(prefix)
    g = Graph()
    # Following triples for testing purposes only. URIs might not exist.
    for t in (
        ( my.sandwich,    RDF.type,    SCHEMA.Food     ),
        ( DCTYPES.Series, RDFS.domain, my.TVChannel    ),
        ( SCHEMA.Cat,     my.meow,     Literal('loud') ),
    ):
        g.add(t)
    return g


def test_replace_prefix():
    old_prefix = 'http://obsolete.info/'
    new_prefix = 'http://fashionable.org/'
    before = graph_with_prefix(old_prefix)
    after = replace_prefix(before, old_prefix, new_prefix)
    after_check = graph_with_prefix(new_prefix)
    assert len(before) == 3
    assert len(after) == 3
    assert len(before - after) == 3
    assert len(after - after_check) == 0


def test_canonical_graph():
    g = canonical_graph()
    assert len(g) > 0
    text = g.serialize(format='n3')
    assert ONTOLOGY_NS.encode() in text
    assert SOURCE_PREFIX == ONTOLOGY_NS or SOURCE_PREFIX.encode() not in text