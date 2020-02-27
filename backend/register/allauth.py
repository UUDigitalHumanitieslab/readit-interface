"""
register allauth customization
Use the adapter below to customize allauth, e.g. the url used in the confirmation email.
For more options, start here: https://django-allauth.readthedocs.io/en/latest/advanced.html
"""
from django.conf import settings
from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def get_email_confirmation_url(self, request, emailconfirmation):
        return '{}/{}'.format(settings.EMAIL_CONFIRMATION_URL, emailconfirmation.key)
