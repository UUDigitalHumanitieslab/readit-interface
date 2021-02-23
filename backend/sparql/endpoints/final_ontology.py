from django.urls import path
from final_ontology import FINAL_ONTOLOGY_ROUTE
from final_ontology.graph import graph
from sparql.views import SPARQLQueryAPIView


class OntologyQueryView(SPARQLQueryAPIView):

    def graph(self):
        return graph()


FINAL_ONTOLOGY_URLS = [
    path('{}/query'.format(FINAL_ONTOLOGY_ROUTE), OntologyQueryView.as_view()),
]
