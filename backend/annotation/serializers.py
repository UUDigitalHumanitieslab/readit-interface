from rest_framework import serializers

from .models import Source, Annotation


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = '__all__'


class SourceSerializer(serializers.ModelSerializer):
    annotations = serializers.SerializerMethodField() 
    
    class Meta:
        model = Source
        fields = '__all__'

    def get_annotations(self, source):
        user_id = self.context['request'].user.id        
        annotations = Annotation.objects.filter(source_id=source.id, user_id=user_id)        
        serializer = AnnotationSerializer(instance=annotations, many=True)
        return serializer.data

    
