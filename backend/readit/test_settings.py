import os.path as op

from .settings import *

RDF_NAMESPACE_HOST = 'testserver'
RDF_NAMESPACE_ROOT = 'http://{}/'.format(RDF_NAMESPACE_HOST)

TRIPLESTORE_NAMESPACE = 'readit-test'
TRIPLESTORE_SPARQL_ENDPOINT = f'http://localhost:9999/blazegraph/namespace/{TRIPLESTORE_NAMESPACE}/sparql'
RDFLIB_STORE = SPARQLUpdateStore(
    query_endpoint=TRIPLESTORE_SPARQL_ENDPOINT,
    update_endpoint=TRIPLESTORE_SPARQL_ENDPOINT,
)

INDEX_FILE_PATH = 'trivial.html'
TESTRUNNER_FILE_PATH = 'trivial.html'

STATICFILES_DIRS += [
    op.join(BASE_DIR, 'readit', 'test_static'),
]
IRISA_TOKEN = 'This is not the token you are looking for'
