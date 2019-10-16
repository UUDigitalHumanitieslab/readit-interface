from rdf.views import RDFView, RDFResourceView
from .graph import graph


class SourcesAPIRoot(RDFView):
    """ For now, simply lists all sources. """
    graph = graph


class SourcesAPISingular(RDFResourceView):
    """ API endpoint for fetching individual subjects. """
    graph = graph
