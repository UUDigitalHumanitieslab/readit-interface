from rest_framework.authentication import (BasicAuthentication,
                                           SessionAuthentication)

from sparql.permissions import SPARQLPermission
from sparql.views import SPARQLQueryAPIView, SPARQLUpdateAPIView

from .graph import graph


class NlpOntologyQueryView(SPARQLQueryAPIView):
    """ Query the NLP ontology through SPARQL-Query """

    def graph(self):
        return graph()


class NlpOntologyUpdateView(SPARQLUpdateAPIView):
    """ Update the NLP ontology through SPARQL-Update """
    permission_classes = (SPARQLPermission,)
    authentication_classes = (SessionAuthentication, BasicAuthentication)

    def graph(self):
        return graph()
