from django.contrib import admin

from .models import Feedback

class FeedbackAdmin(admin.ModelAdmin):
    model = Feedback
    readonly_fields = ('date_created', 'subject', 'feedback', 'provided_by')
    fields = ['date_created', 'subject', 'feedback', 'provided_by', 'label',]
    list_display = ('date_created', 'subject', 'label')
    list_filter = ('date_created', 'label')

admin.site.register(Feedback, FeedbackAdmin)
