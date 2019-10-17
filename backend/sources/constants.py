from django.conf import settings

SOURCES_ROUTE = 'source/'
SOURCES_NS = '{}{}'.format(settings.RDF_NAMESPACE_ROOT, SOURCES_ROUTE)
