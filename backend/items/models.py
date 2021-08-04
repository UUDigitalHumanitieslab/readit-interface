from django.db import models
from django.contrib.postgres.fields import JSONField
from django.conf import settings

from rdf.baseclasses import BaseCounter
from .constants import ITEMS_NS, ITEMS_HISTORY_NS


class ItemCounter(BaseCounter):
    namespace = ITEMS_NS


class EditCounter(BaseCounter):
    namespace = ITEMS_HISTORY_NS


class SemanticQuery(models.Model):
    label = models.CharField(blank=True, max_length=100)
    query = JSONField()
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
    )
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.label or str(self.id)
