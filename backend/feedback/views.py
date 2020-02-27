from django.shortcuts import render
from rest_framework import viewsets, mixins

from .models import Feedback
from .serializers import FeedbackSerializer

from rest_framework.authentication import SessionAuthentication, BasicAuthentication

# Create your views here.
class FeedbackViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def perform_create(self, serializer):
        request = serializer.context['request']
        serializer.save(provided_by=request.user)
