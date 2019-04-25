from django.shortcuts import render
from rest_framework import viewsets, permissions

from .models import Source, Annotation
from .serializers import SourceSerializer, AnnotationSerializer

# Create your views here.
class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SourceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Source.objects.all()
        return queryset


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = Annotation.objects.all()
        return queryset
