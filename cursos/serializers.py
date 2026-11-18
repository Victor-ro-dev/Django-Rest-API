from django.contrib.auth.models import User
from django.db.models import Avg
from rest_framework import serializers

from .models import Avaliacao, Curso


class AvaliacaoSerializer(serializers.ModelSerializer):
    """Serializer para avaliações de cursos, com validação de nota entre 1.0 e 5.0."""

    class Meta:
        model = Avaliacao
        extra_kwargs = {
            'email': {'write_only': True},
        }
        fields = (
            'id',
            'curso',
            'nome',
            'email',
            'comentario',
            'avaliacao',
            'criacao',
            'ativo',
        )

    def validate_avaliacao(self, valor):
        if 1 <= valor <= 5:
            return valor
        raise serializers.ValidationError('A avaliação precisa ser entre 1 e 5.')


class CursoSerializer(serializers.ModelSerializer):
    """Serializer para cursos com média e contagem de avaliações."""

    avaliacoes = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    media_avaliacoes = serializers.SerializerMethodField()
    total_avaliacoes = serializers.SerializerMethodField()

    class Meta:
        model = Curso
        fields = (
            'id',
            'titulo',
            'url',
            'criacao',
            'ativo',
            'avaliacoes',
            'media_avaliacoes',
            'total_avaliacoes',
        )

    def get_media_avaliacoes(self, obj):
        media = getattr(obj, 'media_avaliacoes_avg', None)
        if media is None and not hasattr(obj, 'media_avaliacoes_avg'):
            media = obj.avaliacoes.aggregate(Avg('avaliacao')).get('avaliacao__avg')
        if media is None:
            return 0
        return round(float(media) * 2) / 2

    def get_total_avaliacoes(self, obj):
        total = getattr(obj, 'total_avaliacoes_count', None)
        if total is None:
            return obj.avaliacoes.count()
        return total


class UserSerializer(serializers.ModelSerializer):
    """Serializer público dos dados básicos do usuário autenticado."""

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_superuser')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de novos usuários."""

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
