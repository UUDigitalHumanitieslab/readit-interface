from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view()
def null_view(request):
    return Response(status=status.HTTP_400_BAD_REQUEST)
