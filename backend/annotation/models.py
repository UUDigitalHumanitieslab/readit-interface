from django.db import models

# Create your models here.
class Source(models.Model):
    name = models.CharField(max_length=250)
    author = models.CharField(max_length=250)
    publicationDate = models.DateField()
    text = models.TextField()

    def __str__(self):
        return self.name


class Annotation(models.Model):
    startIndex = models.IntegerField()
    endIndex = models.IntegerField()
    creationDate = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=150)
    source = models.ForeignKey(Source, on_delete=models.DO_NOTHING, related_name='annotations')

