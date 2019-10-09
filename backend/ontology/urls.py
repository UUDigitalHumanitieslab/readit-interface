from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListOntology

urlpatterns = format_suffix_patterns([
    path('', ListOntology.as_view()),
])
