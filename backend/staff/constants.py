from django.conf import settings

STAFF_ROUTE = 'staff'
STAFF_NS = '{}{}#'.format(settings.RDF_NAMESPACE_ROOT, STAFF_ROUTE)
