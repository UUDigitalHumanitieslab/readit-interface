from django.contrib import admin

from .models import SemanticQuery


@admin.register(SemanticQuery)
class SemanticQueryAdmin(admin.ModelAdmin):
    date_hierarchy = 'created'
    fields = ('label', 'creator', 'created', 'query')
    readonly_fields = ('created', 'query')
    autocomplete_fields = ('creator',)
    search_fields = ('label',)
    list_display = ('id', 'label', 'creator', 'created')
    list_display_links = ('id', 'label')
    list_filter = ('created', 'creator')
    show_full_result_count = False

    def view_on_site(self, obj):
        return '/explore/query/{}'.format(obj.id)
