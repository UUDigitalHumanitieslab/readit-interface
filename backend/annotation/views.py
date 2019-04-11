from django.shortcuts import render
from rest_framework import viewsets

from .models import Source, Annotation
from .serializers import SourceSerializer, AnnotationSerializer

# Create your views here.
class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SourceSerializer

    def get_queryset(self):
        queryset = Source.objects.all()
        return queryset


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer

    def get_queryset(self):
        queryset = Annotation.objects.all()
        return queryset
