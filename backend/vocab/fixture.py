"""
This module represents what we believe *should* be in the vocab graph.
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
    Source = my.Source
    RangeSelector = my.RangeSelector
    XPathSelector = OA.XPathSelector
    hasStartSelector = my.hasStartSelector
    hasEndSelector = my.hasEndSelector

    return [
        ( Source,           is_a,          Class ),
        ( Source,           subClassOf,    SCHEMA.CreativeWork ),

        ( RangeSelector,    is_a,          Class ),
        ( RangeSelector,    subClassOf,    OA.RangeSelector ),

        ( hasStartSelector, is_a,          Property ),
        ( hasStartSelector, subPropertyOf, OA.hasStartSelector ),
        ( hasStartSelector, hasDomain,     RangeSelector ),
        ( hasStartSelector, hasRange,      XPathSelector ),

        ( hasEndSelector,   is_a,          Property ),
        ( hasEndSelector,   subPropertyOf, OA.hasEndSelector ),
        ( hasEndSelector,   hasDomain,     RangeSelector ),
        ( hasEndSelector,   hasRange,      XPathSelector ),
    ]

def canonical_graph():
    """ Returns a Graph with correct contents. """
    g = Graph()
    for t in triples():
        g.add(t)
    return g
