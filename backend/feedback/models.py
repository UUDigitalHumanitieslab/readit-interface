from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Feedback(models.Model):
    subject = models.CharField(max_length=150, blank=True)
    label = models.CharField(max_length=150, blank=True, default='Not labelled yet')
    feedback = models.TextField()
    date_created = models.DateTimeField(auto_now_add=True)
    provided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        verbose_name_plural = "feedback"
