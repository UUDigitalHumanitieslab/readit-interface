from rest_framework import serializers

from .models import SemanticQuery


class SemanticQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SemanticQuery
        fields = ['id', 'label', 'query']

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)
