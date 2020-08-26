"""
This module generates the graph "live" based on the Users table.
"""

from django.contrib.auth.models import User

from rdflib import Graph, Literal

from rdf.ns import *
from rdf.utils import append_triples
from . import namespace as my

is_a = RDF.type
Person = FOAF.Person
prefLabel = SKOS.prefLabel
firstName = FOAF.givenName
lastName = FOAF.familyName


def as_rdf(user):
    """ Represent user as a set of RDF triples. """
    username = user.username
    subject = my[username]
    first = user.first_name
    last = user.last_name

    yield (     subject, is_a,      Person )
    yield (     subject, prefLabel, Literal(username) )
    if first:
        yield ( subject, firstName, Literal(first) )
    if last:
        yield ( subject, lastName,  Literal(last) )


def graph():
    """ Recomputes the staff graph on every invocation. """
    g = Graph()
    for user in User.objects.all():
        append_triples(g, as_rdf(user))
    return g
