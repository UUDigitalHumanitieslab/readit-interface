from datetime import datetime

from django.core.files.storage import default_storage

from rdflib import Graph, URIRef, Literal

from annotation.models import Annotation
from rdf.ns import *
from rdf.utils import append_triples
from vocab import namespace as VOCAB
from staff import namespace as STAFF
from ontology import namespace as ONTO
from sources import namespace as SOURCE
from sources.utils import get_media_filename
from . import namespace as my
from .graph import graph
from .models import ItemCounter

XPATH = 'substring(.//*[0]/text(), {})'
TEXT_CACHE = {}
CONTEXT_LENGTH = 60

is_a = RDF.type


def get_text(serial):
    """
    Return the text of the source with the given serial, cached if possible.
    """
    text = TEXT_CACHE.get(serial)
    if text:
        return text
    with default_storage.open(get_media_filename(serial), 'r') as f:
        text = f.read()
    TEXT_CACHE[serial] = text
    return text


def get_adjacent_text(serial, prefix_end, suffix_start):
    """ Get a prefix before start and a suffix after end for source serial. """
    text = get_text(serial)
    prefix_start = max(0, prefix_end - CONTEXT_LENGTH)
    suffix_end = min(suffix_start + CONTEXT_LENGTH, len(text))
    return text[prefix_start:prefix_end], text[suffix_start:suffix_end]


def get_subject_uris():
    """ Return an object with a unique subject URI in each attribute. """
    counter = ItemCounter.current
    class Subject:
        pass
    for name in 'anno resource range_sel start_sel end_sel quote_sel'.split():
        counter.increment()
        setattr(Subject, name, URIRef(str(counter)))
    return Subject


def as_xpath(offset):
    """ Convert a numeric offset to a full XPath with NodeIndex 0. """
    return XPATH.format(offset)


def as_rdf(annotation):
    """ Represent annotation as a set of RDF triples. """

    # First some "easy" constants
    user = STAFF[annotation.user.username]
    startIndex = annotation.startIndex
    endIndex = annotation.endIndex
    start_xpath = as_xpath(startIndex)
    end_xpath = as_xpath(endIndex)
    exact = annotation.text
    date = Literal(annotation.creationDate)
    classURI = ONTO[annotation.category]
    source_serial = annotation.source.pk
    source = SOURCE[str(source_serial)]

    # URIs for each of the subjects we are about to create
    subject = get_subject_uris()

    # Prefix and suffix to complete the TextQuoteSelector
    prefix, suffix = get_adjacent_text(source_serial, startIndex, endIndex)

    yield (     subject.quote_sel, is_a,                OA.TextQuoteSelector )
    if prefix:
        yield ( subject.quote_sel, OA.prefix,           Literal(prefix)      )
    yield (     subject.quote_sel, OA.exact,            Literal(exact)       )
    if suffix:
        yield ( subject.quote_sel, OA.suffix,           Literal(suffix)      )
    yield (     subject.quote_sel, DCTERMS.creator,     user                 )
    yield (     subject.quote_sel, DCTERMS.created,     date                 )

    yield (     subject.start_sel, is_a,                OA.XPathSelector     )
    yield (     subject.start_sel, RDF.value,           Literal(start_xpath) )
    yield (     subject.start_sel, DCTERMS.creator,     user                 )
    yield (     subject.start_sel, DCTERMS.created,     date                 )

    yield (     subject.end_sel,   is_a,                OA.XPathSelector     )
    yield (     subject.end_sel,   RDF.value,           Literal(end_xpath)   )
    yield (     subject.end_sel,   DCTERMS.creator,     user                 )
    yield (     subject.end_sel,   DCTERMS.created,     date                 )

    yield (     subject.range_sel, is_a,                VOCAB.RangeSelector  )
    yield (     subject.range_sel, OA.hasStartSelector, subject.start_sel    )
    yield (     subject.range_sel, OA.hasEndSelector,   subject.end_sel      )
    yield (     subject.range_sel, DCTERMS.creator,     user                 )
    yield (     subject.range_sel, DCTERMS.created,     date                 )

    yield (     subject.resource,  is_a,                OA.SpecificResource  )
    yield (     subject.resource,  OA.hasSource,        source               )
    yield (     subject.resource,  OA.hasSelector,      subject.range_sel    )
    yield (     subject.resource,  OA.hasSelector,      subject.quote_sel    )
    yield (     subject.resource,  DCTERMS.creator,     user                 )
    yield (     subject.resource,  DCTERMS.created,     date                 )

    yield (     subject.anno,      is_a,                OA.Annotation        )
    yield (     subject.anno,      OA.hasBody,          classURI             )
    yield (     subject.anno,      OA.hasTarget,        subject.resource     )
    yield (     subject.anno,      OA.motivatedBy,      OA.tagging           )
    yield (     subject.anno,      DCTERMS.creator,     user                 )
    yield (     subject.anno,      DCTERMS.created,     date                 )


def canonical_graph():
    """
    Returns a graph containing all triples that should be in the store.

    Since this is a data migration and we don't actually want to
    delete anything, this draws triples from TWO sources:

     1. The instances of the deprecated annotation.models.Annotation,
        mapped through as_rdf.
     2. All of the triples that are already in .graph.graph.
    """
    g = Graph()
    for annotation in Annotation.objects.all():
        append_triples(g, as_rdf(annotation))
    g += graph()
    return g
