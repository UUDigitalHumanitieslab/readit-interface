from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListNlpOntology

urlpatterns = format_suffix_patterns([
    path('', ListNlpOntology.as_view()),
])
