from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    ''' Removes CSRF check from SessionAuthentication '''

    def enforce_csrf(self, request):
        return
