from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ItemsAPIRoot

urlpatterns = format_suffix_patterns([
    path('', ItemsAPIRoot.as_view()),
])
