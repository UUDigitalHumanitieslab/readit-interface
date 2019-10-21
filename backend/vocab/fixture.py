"""
This module represents what we believe *should* be in .graph.graph().
"""

from rdflib import Graph, URIRef, Literal

from rdf.ns import *

from . import namespace as my

def triples():
    """ Returns the triples that should be in the graph. """
    is_a = RDF.type
    Class = RDFS.Class
    subClassOf = RDFS.subClassOf
    Property = RDF.Property
    subPropertyOf = RDFS.subPropertyOf
    hasDomain = RDFS.domain
    hasRange = RDFS.range
    XPathSelector = OA.XPathSelector

    return [
        ( my.Source,           is_a,          Class ),
        ( my.Source,           subClassOf,    SCHEMA.CreativeWork ),

        ( my.RangeSelector,    is_a,          Class ),
        ( my.RangeSelector,    subClassOf,    OA.RangeSelector ),

        ( my.hasStartSelector, is_a,          Property ),
        ( my.hasStartSelector, subPropertyOf, OA.hasStartSelector ),
        ( my.hasStartSelector, hasDomain,     my.RangeSelector ),
        ( my.hasStartSelector, hasRange,      XPathSelector ),

        ( my.hasEndSelector,   is_a,          Property ),
        ( my.hasEndSelector,   subPropertyOf, OA.hasEndSelector ),
        ( my.hasEndSelector,   hasDomain,     my.RangeSelector ),
        ( my.hasEndSelector,   hasRange,      XPathSelector ),
    ]

def canonical_graph():
    """ Returns a Graph with correct contents. """
    g = Graph()
    for t in triples():
        g.add(t)
    return g
