from rdflib import URIRef

from rdf.views import RDFView
from . import namespace as my
from .constants import UNKNOWN
from .graph import graph


def get_user_uriref(request):
    """ Represent request.user as a URIRef."""
    user = request.user
    if user:
        return my[user.username]
    return URIRef(UNKNOWN)


class ListStaff(RDFView):
    """ List the full staff in RDF. """
    def get_graph(self, request, **kwargs):
        return graph()
