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

EXISTS_CHECK = '''ASK {
    GRAPH ?graph {
        ?subject ?predicate ?object
    }
}'''


def move():
    deanonymize()
    cg = get_conjunctive_graph()
    store = settings.RDFLIB_STORE
    predicates = set(cg.predicates())
    print('Iterating {} predicates'.format(len(predicates)))
    for predicate in predicates:
        print('\n{}'.format(predicate))
        if not store.query(EXISTS_CHECK, initBindings={'predicate': predicate}):
            print('Not yet in target store, copying')
            store.addN(cg.quads((None, predicate, None)))
        else:
            print('Already in target store, skipping')
