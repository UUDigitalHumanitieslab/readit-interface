import logging
from items.graph import graph as item_graph
from sparql.utils import xml_sanitize_triple
from django.conf import settings
from os import environ
environ.setdefault('DJANGO_SETTINGS_MODULE', 'readit.settings')

settings.RDFLIB_STORE.returnFormat = 'json'

logger = logging.getLogger('scripts')


def find_dirty_triples():
    g = item_graph()
    for triple in g:
        is_cleaned, cleaned_triple = xml_sanitize_triple(triple)
        if is_cleaned:
            logger.warning(f'Dirty triple: {triple}' + '\n' + \
            f'Clean triple: {cleaned_triple}')


def clean_dirty_triples():
    g = item_graph()
    for triple in g:
        is_cleaned, cleaned_triple = xml_sanitize_triple(triple)
        if is_cleaned:
            g -= triple
            g += cleaned_triple
