import os.path as op

from .settings import *

RDF_NAMESPACE_HOST = 'testserver'
RDF_NAMESPACE_ROOT = 'http://{}/'.format(RDF_NAMESPACE_HOST)
RDFLIB_STORE = 'Django'

INDEX_FILE_PATH = 'trivial.html'
TESTRUNNER_FILE_PATH = 'trivial.html'

STATICFILES_DIRS += [
    op.join(BASE_DIR, 'readit', 'test_static'),
]
