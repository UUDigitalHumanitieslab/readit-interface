""" This is magic glue for integrating the frontend and backend.

    This is NOT the place for backend customizations. Go to
    backend/readit/settings.py instead.
"""

from readit.settings import *
import os.path as op

TRIPLESTORE_SPARQL_ENDPOINT = f'http://blazegraph:9999/bigdata/namespace/{TRIPLESTORE_NAMESPACE}/sparql'
RDFLIB_STORE = SPARQLUpdateStore(
    query_endpoint=TRIPLESTORE_SPARQL_ENDPOINT,
    update_endpoint=TRIPLESTORE_SPARQL_ENDPOINT,
)

CELERY_BROKER_URL = 'amqp://guest:guest@rabbitmq:5672'

DATABASES['default']['HOST'] = 'postgres'

ES_HOST = 'elastic'

TESTRUNNER_FILE_PATH = 'specRunner.html'

STATICFILES_DIRS += [
    op.join(op.dirname(BASE_DIR), 'frontend', 'dist'),
    op.join(op.dirname(BASE_DIR), 'frontend', 'node_modules'),
]
