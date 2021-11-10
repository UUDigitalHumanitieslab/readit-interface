from django.urls import path

from source_ontology import SOURCE_ONTOLOGY_ROUTE
from source_ontology.graph import graph
from sparql.views import SPARQLQueryAPIView, SPARQLUpdateAPIView


class SourceOntologyQueryView(SPARQLQueryAPIView):

    def graph(self):
        return graph()


class SourceOntologyUpdateView(SPARQLUpdateAPIView):

    def graph(self):
        return graph()


SOURCE_ONTOLOGY_URLS = [
    path('{}/query'.format(SOURCE_ONTOLOGY_ROUTE),
         NlpOntologyQueryView.as_view()),
    path('{}/update'.format(SOURCE_ONTOLOGY_ROUTE),
         NlpOntologyUpdateView.as_view())
]
