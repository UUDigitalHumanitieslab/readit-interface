from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListSourceOntology

urlpatterns = format_suffix_patterns([
    path('', ListSourceOntology.as_view()),
])
