from django.conf import settings

STAFF_ROUTE = 'staff'
STAFF_NS = '{}{}#'.format(settings.RDF_NAMESPACE_ROOT, STAFF_ROUTE)

# URI for representing the unauthenticated visitor.
# Probably not the best possible, but it will do for now.
UNKNOWN = 'https://www.wikidata.org/wiki/Q24238356'
