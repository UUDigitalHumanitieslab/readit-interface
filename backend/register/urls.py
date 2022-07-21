"""
register URL Configuration
This exists as a workaround for known issues with the (poorly maintained) rest-auth library.
See, for example, 'https://github.com/Tivix/django-rest-auth/issues/292'.
"""
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from dj_rest_auth.registration.views import VerifyEmailView, RegisterView
from allauth.account.views import confirm_email
from .views import null_view

urlpatterns = [
    re_path(r'^account-email-verification-sent/', null_view, name='account_email_verification_sent'),
    re_path(r'^account-confirm-email/', null_view, name='account_confirm_email'),
    path('', include('dj_rest_auth.registration.urls')),
]
