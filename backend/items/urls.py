from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ItemsEndpoint

urlpatterns = format_suffix_patterns([
    path('', ItemsEndpoint.as_view()),
])
