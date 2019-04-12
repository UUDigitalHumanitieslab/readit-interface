from rest_framework import serializers

from .models import Source, Annotation


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = '__all__'


class SourceSerializer(serializers.ModelSerializer):
    annotations = AnnotationSerializer(many=True, read_only=True)
    date_last_annotated = serializers.SerializerMethodField()
    
    class Meta:
        model = Source
        fields = '__all__'

    def get_date_last_annotated(self, source):
        # TODO: implement filtering on current user
        annotations = Annotation.objects.filter(source_id=source.id)
        if not annotations: return None
        return annotations.latest('creationDate').creationDate.strftime('%d %b %Y')
