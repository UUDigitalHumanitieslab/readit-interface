from datetime import datetime

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from rdflib import Graph, Literal

from annotation.models import Source
from rdf.ns import *
from rdf.utils import append_triples
from vocab import namespace as VOCAB
from staff import namespace as STAFF
from . import namespace as my
from .graph import graph
from .utils import get_media_filename

HOUR_OF_TRUTH = Literal(datetime(2019, 4, 15, 13))


def as_rdf(source):
    """ Represent source as a set of RDF triples. """
    serial = source.pk
    name = source.name
    author = source.author
    date = source.publicationDate
    text = source.text
    language = source.language

    subject = my[str(serial)]
    text_fname = get_media_filename(serial)
    if not default_storage.exists(text_fname):
        default_storage.save(text_fname, ContentFile(text))

    yield ( subject, RDF.type,             VOCAB.Source      )
    yield ( subject, SCHEMA.name,          Literal(name)     )
    yield ( subject, SCHEMA.creator,       Literal(author)   )
    yield ( subject, SCHEMA.datePublished, Literal(date)     )
    yield ( subject, SCHEMA.inLanguage,    Literal(language) )
    yield ( subject, DCTERMS.creator,      STAFF.AHebing     )
    yield ( subject, DCTERMS.created,      HOUR_OF_TRUTH     )


def canonical_graph():
    """
    Returns a graph containing all triples that should be in the store.

    Since this is a data migration and we don't actually want to
    delete anything, this draws triples from TWO sources:

     1. The instances of the deprecated annotation.models.Source,
        mapped through as_rdf.
     2. All of the triples that are already in .graph.graph().
    """
    g = Graph()
    for source in Source.objects.all():
        append_triples(g, as_rdf(source))
    g += graph()
    return g
