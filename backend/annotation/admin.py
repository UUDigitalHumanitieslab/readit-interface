from django.contrib import admin

from .models import Source, Annotation


# Register your models here.
class SourceAdmin(admin.ModelAdmin):
    model = Source
    list_filter = ('name', 'author', 'language')
    list_display = ('name', 'author', 'language')

class AnnoAdmin(admin.ModelAdmin):
    model = Annotation
    list_display = ('user', 'source', 'text', 'category')
    list_filter = ('source', 'user', 'text',)


admin.site.register(Source, SourceAdmin)
admin.site.register(Annotation, AnnoAdmin)
