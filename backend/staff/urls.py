from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ListStaff

urlpatterns = format_suffix_patterns([
    path('', ListStaff.as_view()),
])
