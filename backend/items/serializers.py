from rest_framework import serializers

from .models import SemanticQuery


class SemanticQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SemanticQuery
        fields = ['id', 'label', 'query']
