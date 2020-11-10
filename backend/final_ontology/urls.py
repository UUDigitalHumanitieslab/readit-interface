from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListFinalOntology

urlpatterns = format_suffix_patterns([
    path('', ListFinalOntology.as_view())
])
