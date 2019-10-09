from django.conf import settings

ITEMS_ROUTE = 'item/'
ITEMS_NS = '{}{}#'.format(settings.RDF_NAMESPACE_ROOT, ITEMS_ROUTE)
