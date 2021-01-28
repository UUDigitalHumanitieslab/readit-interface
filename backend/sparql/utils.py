from rdflib import BNode
from rdflib.plugins.stores.sparqlstore import _node_to_sparql


def bnode_to_sparql(node):
    '''Serializes blank nodes from sparqlstore'''
    if isinstance(node, BNode):
        return '<bnode:%s>' % node
    return _node_to_sparql(node)
