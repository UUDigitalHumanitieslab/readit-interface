from django.contrib import admin

from .models import Source, Annotation


# Register your models here.
class SourceAdmin(admin.ModelAdmin):
    model = Source
    list_filter = ('name', 'author',)
    list_display = ('name', 'author',)

class AnnoAdmin(admin.ModelAdmin):
    model = Annotation
    list_display = ('source', 'user', 'text')
    list_filter = ('source', 'user', 'text',)
    

admin.site.register(Source, SourceAdmin)
admin.site.register(Annotation, AnnoAdmin)