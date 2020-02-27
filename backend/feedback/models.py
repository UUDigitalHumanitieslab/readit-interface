from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# Create your models here.
class Feedback(models.Model):
    subject = models.CharField(max_length=150, blank=True)
    label = models.CharField(max_length=150, blank=True, default='Not labelled yet')
    feedback = models.TextField()
    date_created = models.DateTimeField()
    provided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        ''' If new, set the created date '''
        if self.pk is None:
            self.date_created = datetime.now()
        return super(Feedback, self).save(*args, **kwargs)
