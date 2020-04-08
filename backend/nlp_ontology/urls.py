from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

from .views import NlpOntologyApiView

urlpatterns = format_suffix_patterns([
    path('', NlpOntologyApiView.as_view())
])
