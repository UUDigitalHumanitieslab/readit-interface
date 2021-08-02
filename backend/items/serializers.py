from rest_framework import serializers

from .models import SemanticQuery


class SemanticQuerySerializerFull(serializers.ModelSerializer):
    class Meta:
        model = SemanticQuery
        fields = ['id', 'label', 'query']


class SemanticQuerySerializer(serializers.ModelSerializer):
    class Meta(SemanticQuerySerializerFull.Meta):
        extra_kwargs = {
            'query': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)
