from rest_framework.views import APIView
from rest_framework.response import Response

from rdf.renderers import JSONLD_Renderer
from .graph import graph

class ListVocab(APIView):
    """
    List the full vocabulary in RDF.

    Individual terms are addressed as fragments, e.g. #Source.
    For now, only json-ld is supported.
    """
    renderer_classes = (JSONLD_Renderer,)

    def get(self, request, format=None):
        return Response(graph)
