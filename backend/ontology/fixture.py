"""
This module represents what we believe *should* be in .graph.graph().
"""

import re

import requests
from rdf.ns import *
from rdflib import Graph, Literal, URIRef

from . import namespace as my
from .constants import (OLD_SOURCE, OLD_SOURCE_PREFIX, ONTOLOGY_NS, SOURCE,
                        SOURCE_CLASS_PREFIX, SOURCE_FORMAT, SOURCE_PREFIX,
                        SOURCE_PROPERTY_PREFIX)

REPARSE_FORMAT = 'n3'


def replace_prefix(graph_in, prefix_in, prefix_out):
    """
    Return a new graph in which SOURCE_PREFIX is replaced by ONTOLOGY_NS.

    This function works by serializing `graph_in` to bytes, textually
    replacing the prefix and then parsing the result into a new Graph.
    Not efficient; do not use for large graphs.
    """
    if type(prefix_in) == str:
        prefix_in = prefix_in.encode()
    if type(prefix_out) == str:
        prefix_out = prefix_out.encode()
    serialized = graph_in.serialize(format=REPARSE_FORMAT)
    replaced = serialized.replace(prefix_in, prefix_out)
    graph_out = Graph()
    graph_out.parse(data=replaced, format=REPARSE_FORMAT)
    return graph_out


def canonical_graph():
    """
    Returns the graph from our external source, with fixes.

    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = Graph()
    g.parse(OLD_SOURCE, format='json-ld')
    if OLD_SOURCE_PREFIX != ONTOLOGY_NS:
        return replace_prefix(g, OLD_SOURCE_PREFIX, ONTOLOGY_NS)
    return g


def reo_graph():
    source = requests.get(SOURCE).text
    to_replace = (SOURCE_PROPERTY_PREFIX, SOURCE_CLASS_PREFIX,
                  SOURCE_PREFIX)
    replaced_source = re.sub((r'|').join(to_replace), ONTOLOGY_NS, source)

    g = Graph()
    g.parse(data=replaced_source, format=SOURCE_FORMAT)
    return g


