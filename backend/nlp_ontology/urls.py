from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from .views import NlpOntologyQueryView, NlpOntologyUpdateView

urlpatterns = format_suffix_patterns([
    path('update', NlpOntologyUpdateView.as_view()),
    path('', NlpOntologyQueryView.as_view()),
])
