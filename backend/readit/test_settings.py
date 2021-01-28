import os.path as op

from .settings import *
from sparql.utils import bnode_to_sparql

RDF_NAMESPACE_HOST = 'testserver'
RDF_NAMESPACE_ROOT = 'http://{}/'.format(RDF_NAMESPACE_HOST)

RDFLIB_STORE_PREFIX = 'http://localhost:3030/readit-test'
RDFLIB_STORE = SPARQLUpdateStore(
    queryEndpoint='{}/query'.format(RDFLIB_STORE_PREFIX),
    update_endpoint='{}/update'.format(RDFLIB_STORE_PREFIX),
    node_to_sparql=bnode_to_sparql
)

INDEX_FILE_PATH = 'trivial.html'
TESTRUNNER_FILE_PATH = 'trivial.html'

STATICFILES_DIRS += [
    op.join(BASE_DIR, 'readit', 'test_static'),
]
