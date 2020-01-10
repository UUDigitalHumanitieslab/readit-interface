from datetime import datetime, timezone
from rdflib import Literal
from rdflib import URIRef
from . import namespace as my
from .constants import UNKNOWN


def get_user_uriref(request):
    """ Represent request.user as a URIRef."""
    user = request.user
    if user:
        return my[user.username]
    return URIRef(UNKNOWN)


def submission_info(request):
    """ Return user and datetime of request as RDF terms. """
    user = get_user_uriref(request)
    now = Literal(datetime.now(timezone.utc))
    return user, now
