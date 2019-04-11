from rest_framework import serializers

from .models import Source, Annotation


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = '__all__'


class SourceSerializer(serializers.ModelSerializer):
    annotations = AnnotationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Source
        fields = '__all__'

