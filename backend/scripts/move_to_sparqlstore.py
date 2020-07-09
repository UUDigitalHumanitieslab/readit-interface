"""
Script for moving all quads from the rdflib_django store to Jena.

Usage: open an interactive Python shell with Django's `shell`
command. Then:

>>> from scripts.move_to_sparqlstore import move
>>> move()
"""

if __name__ == '__main__':
    import sys
    print(__doc__)
    sys.exit()

from django.conf import settings

from rdflib_django.utils import get_conjunctive_graph

from scripts.deanonymize_snapshots import deanonymize


def move():
    deanonymize()
    settings.RDFLIB_STORE.addN(get_conjunctive_graph().quads())
