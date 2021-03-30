"""
Script for sanitizing graphs of XML invalid characters.

Usage: open an interactive Python shell with Django's `shell`
command. When working on a server, pass the arguments `--settings
settings --pythonpath {directory/of/settings/file}`.
Then:
>>> from scripts.xml_sanitize import find_dirty_triples
>>> find_dirty_triples()

To also clean the graph in place:
>>> find_dirty_triples(sanitize_graph=True)

The results are logged to the configured handlers.
"""

if __name__ == '__main__':
    import sys
    print(__doc__)
    sys.exit()

import logging
from items.graph import graph as item_graph
from sparql.utils import xml_sanitize_triple
from django.conf import settings
from os import environ
environ.setdefault('DJANGO_SETTINGS_MODULE', 'readit.settings')

settings.RDFLIB_STORE.returnFormat = 'json'

logger = logging.getLogger('scripts')


def find_dirty_triples(sanitize_graph=False, graph=item_graph):
    """
    Finds triples containing XML invalid characters in specified graph (default 'items').
    If sanitize_graph=True, also replaces them by their cleaned counterpart.
    """
    g = graph()
    cleaned_cnt = 0
    for triple in g:
        is_cleaned, cleaned_triple = xml_sanitize_triple(triple)
        if is_cleaned:
            cleaned_cnt += 1
            logger.warning('Dirty triple: {}\nClean triple: {}'.format(
                triple, cleaned_triple))
            if sanitize_graph:
                g.remove(triple)
                g.add(cleaned_triple)
    print('Done, found {} dirty triples.'.format(cleaned_cnt))
