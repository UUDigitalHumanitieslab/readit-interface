"""
Script for turning blank nodes in item snapshots into URI nodes.

This script is automatically invoked as a subprocedure of the
`move_to_sparqlstore` script, so you generally don't need to run it
manually.

Usage: open an interactive Python shell with Django's `shell`
command. Then:

>>> from scripts.deanonymize_snapshots import deanonymize
>>> deanonymize()
"""

if __name__ == '__main__':
    import sys
    print(__doc__)
    sys.exit()

from rdflib import URIRef, BNode, Graph

from rdf.ns import *
from items.models import EditCounter
from items.graph import history

counter = EditCounter.current


def next_uri():
    global counter
    counter.increment()
    return URIRef(str(counter))


def deanonymize():
    g = history()
    additions = Graph()
    removals = Graph()
    for snapshot in g.subjects(OA.motivatedBy, OA.editing):
        for body in g.objects(snapshot, OA.hasBody):
            if isinstance(body, BNode):
                body_uri = next_uri()
                removals.add((snapshot, OA.hasBody, body))
                additions.add((snapshot, OA.hasBody, body_uri))
                for p, o in g.predicate_objects(body):
                    removals.add((body, p, o))
                    additions.add((body_uri, p, o))
        for target in g.objects(snapshot, OA.hasTarget):
            if isinstance(target, BNode):
                target_uri = next_uri()
                removals.add((snapshot, OA.hasTarget, target))
                additions.add((snapshot, OA.hasTarget, target_uri))
                for p, o in g.predicate_objects(target):
                    removals.add((target, p, o))
                    if isinstance(o, BNode): # state
                        state_uri = next_uri()
                        for ps, os in g.predicate_objects(o):
                            removals.add((o, ps, os))
                            additions.add((state_uri, ps, os))
                        o = state_uri
                    additions.add((target_uri, p, o))
    with open('snapshot_blanks.ttl', 'wb') as backup:
        removals.serialize(backup, 'turtle')
    g -= removals
    g += additions
