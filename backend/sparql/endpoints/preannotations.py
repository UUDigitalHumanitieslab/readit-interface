from django.urls import path
from items.constants import PREANNOS_ROUTE
from items.graph import preannos_graph
from sparql.views import SPARQLQueryAPIView


class PreannotationsQueryView(SPARQLQueryAPIView):
    def graph(self):
        return preannos_graph()


PREANNOS_URLS = [
    path('{}/query'.format(PREANNOS_ROUTE), PreannotationsQueryView.as_view())
]
