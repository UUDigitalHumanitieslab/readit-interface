from django.conf import settings

SOURCES_SLUG = 'source'

SOURCES_ROUTE = '{}/'.format(SOURCES_SLUG)
SOURCES_NS = '{}{}'.format(settings.RDF_NAMESPACE_ROOT, SOURCES_ROUTE)

