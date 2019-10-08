"""
This module represents what we believe *should* be in .graph.graph.
"""

from rdflib import Graph, URIRef, Literal

from rdf.ns import *

from . import namespace as my
from .constants import SOURCE, SOURCE_FORMAT, SOURCE_PREFIX, ONTOLOGY_NS


def canonical_graph():
    """
    Returns the graph from our external source, with fixes.

    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = Graph()
    g.parse(SOURCE, format=SOURCE_FORMAT)
    # if SOURCE_PREFIX != ONTOLOGY_NS:
    #
    return g
