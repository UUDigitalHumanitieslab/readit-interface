from django.contrib import admin

from .models import Source

# Register your models here.
class SourceAdmin(admin.ModelAdmin):
    model = Source
    list_filter = ('name', 'author',)
    list_display = ('name', 'author',)

admin.site.register(Source, SourceAdmin)