from rdf.views import RDFView
from .graph import graph

class ListVocab(RDFView):
    """ List the full vocabulary in RDF. """
    graph = graph
