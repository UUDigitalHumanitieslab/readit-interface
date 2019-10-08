from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListVocab

urlpatterns = format_suffix_patterns([
    path('', ListVocab.as_view()),
])
