from django.db import models
# See https://docs.djangoproject.com/en/2.2/_modules/django/utils/decorators/
from django.utils.decorators import classproperty

from .constants import ITEMS_NS


class ItemCounter(models.Model):
    """ AUTOINCREMENT for RDF subject URIs. """
    count = models.PositiveIntegerField()

    def __str__(self):
        """ The subject URI associated with the current value of `count`. """
        return '{}{}'.format(ITEMS_NS, self.count)

    @classproperty
    def current(cls):
        """ Get or create a singleton instance of ItemCounter. """
        instance = getattr(cls, '_current', None)
        if instance:
            return instance
        instance = cls.objects.all().first()
        if not instance:
            instance = ItemCounter(count=1)
            instance.save()
        cls._current = instance
        return instance

    def increment(self):
        """ Add 1 to the count and save immediately. """
        self.count += 1
        self.save()
