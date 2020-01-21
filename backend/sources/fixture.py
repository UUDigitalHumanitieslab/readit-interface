from rdflib import Graph, URIRef, Literal

from rdf.ns import *
from rdf.utils import graph_from_triples
from .graph import graph


def get_language_triples(graph, language):
    return graph_from_triples(graph.triples((None, SCHEMA.inLanguage, Literal(language))))

def canonical_graph():
    """
    Returns the graph from our external source, with fixes.
    If different, SOURCE_PREFIX is replaced by ONTOLOGY_NS in all
    URIRefs.
    """
    g = graph_from_triples(graph())
    english = get_language_triples(g, "en")
    german = get_language_triples(g, "de")
    french = get_language_triples(g, "fr")

    g -= english
    g -= german
    g -= french

    g += graph_from_triples((s, p, ISO6391.en) for s, p, o in english)
    g += graph_from_triples((s, p, ISO6391.de) for s, p, o in german)
    g += graph_from_triples((s, p, ISO6391.fr) for s, p, o in french)

    return g
