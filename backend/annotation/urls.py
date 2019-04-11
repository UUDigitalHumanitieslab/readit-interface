from django.conf.urls import url, include
from rest_framework import routers
from annotation import views

router = routers.DefaultRouter()
router.register(r'annotations', views.SourceViewSet, base_name='annotations')