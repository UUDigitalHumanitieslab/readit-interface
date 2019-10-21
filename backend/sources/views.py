from django.core.files.storage import default_storage

from rdflib import Graph, Literal

from rdf.ns import *
from rdf.views import RDFView, RDFResourceView
from .graph import graph
from .utils import get_media_filename


def inject_fulltext(input):
    """ Return a copy of input that has the fulltext for each source. """
    subjects = set(input.subjects())
    text_triples = Graph()
    for s in subjects:
        serial = str(s).split('/')[-1]
        with default_storage.open(get_media_filename(serial)) as f:
            text_triples.add((s, SCHEMA.text, Literal(f.read())))
    return input + text_triples


class SourcesAPIRoot(RDFView):
    """ For now, simply lists all sources. """

    def graph(self):
        return graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs))


class SourcesAPISingular(RDFResourceView):
    """ API endpoint for fetching individual subjects. """

    def graph(self):
        return graph()

    def get_graph(self, request, **kwargs):
        return inject_fulltext(super().get_graph(request, **kwargs))
