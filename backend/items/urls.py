from django.urls import path

from rest_framework.urlpatterns import format_suffix_patterns

from .views import ItemsAPIRoot, ItemsAPIDownload, ItemsAPISingular, ItemsOfCategory

urlpatterns = format_suffix_patterns([
    path('', ItemsAPIRoot.as_view()),
    path('download', ItemsAPIDownload.as_view()),
    path('<int:serial>', ItemsAPISingular.as_view()),
    path('<slug:category>', ItemsOfCategory.as_view()),
])
