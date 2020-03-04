from django.conf import settings

ITEMS_SLUG = 'item'

ITEMS_ROUTE = '{}/'.format(ITEMS_SLUG)
ITEMS_NS = '{}{}'.format(settings.RDF_NAMESPACE_ROOT, ITEMS_ROUTE)

ITEMS_HISTORY_ROUTE = '{}-history/'.format(ITEMS_SLUG)
ITEMS_HISTORY_NS = '{}{}'.format(settings.RDF_NAMESPACE_ROOT, ITEMS_HISTORY_ROUTE)
