from django.conf import settings

NLP_ONTOLOGY_ROUTE = 'nlp-ontology'
NLP_ONTOLOGY_NS = '{}{}#'.format(
    settings.RDF_NAMESPACE_ROOT, 'nlp-ontology')
