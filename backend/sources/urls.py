from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import SourcesAPIRoot, SourcesAPISingular, AddSource

urlpatterns = format_suffix_patterns([
    path('add/', AddSource.as_view()),
    path('', SourcesAPIRoot.as_view()),
    path('<int:serial>', SourcesAPISingular.as_view()),
])
