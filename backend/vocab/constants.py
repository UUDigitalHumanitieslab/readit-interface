from django.conf import settings

VOCAB_ROUTE = 'vocab'
VOCAB_INFIX = '{}#'.format(VOCAB_ROUTE)
VOCAB_NS = settings.RDF_NAMESPACE_ROOT + VOCAB_INFIX
