from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from rest_framework import filters, generics, mixins, permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Avaliacao, Curso
from .pagination import AvaliacaoSmallPagination
from .permissions import EhSuperUser
from .serializers import (
    AvaliacaoSerializer,
    CursoSerializer,
    RegisterSerializer,
    UserSerializer,
)


def get_cursos_queryset():
    """Retorna queryset de cursos anotado com média e total de avaliações para evitar N+1 queries."""
    return Curso.objects.annotate(
        media_avaliacoes_avg=Avg('avaliacoes__avaliacao'),
        total_avaliacoes_count=Count('avaliacoes'),
    ).order_by('id')


# API v1
class CursosAPIView(generics.ListCreateAPIView):
    queryset = get_cursos_queryset()
    serializer_class = CursoSerializer


class CursoAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = get_cursos_queryset()
    serializer_class = CursoSerializer


class AvaliacoesAPIView(generics.ListCreateAPIView):
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer

    def get_queryset(self):
        if self.kwargs.get('curso_pk'):
            return self.queryset.filter(curso_id=self.kwargs.get('curso_pk'))
        return self.queryset.all()


class AvaliacaoAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer

    def get_object(self):
        if self.kwargs.get('curso_pk'):
            return get_object_or_404(
                self.get_queryset(),
                curso_id=self.kwargs.get('curso_pk'),
                pk=self.kwargs.get('avaliacao_pk'),
            )
        return get_object_or_404(self.get_queryset(), pk=self.kwargs.get('avaliacao_pk'))


# API v2
class CursoViewSet(viewsets.ModelViewSet):
    """ViewSet completo para CRUD de cursos e listagem paginada de suas avaliações."""

    permission_classes = (permissions.IsAuthenticatedOrReadOnly, EhSuperUser)
    queryset = get_cursos_queryset()
    serializer_class = CursoSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('titulo', 'url')
    ordering_fields = ('id', 'titulo', 'criacao', 'media_avaliacoes_avg')

    @action(detail=True, methods=['get'])
    def avaliacoes(self, request, pk=None):
        curso = self.get_object()
        avaliacoes = Avaliacao.objects.filter(curso_id=curso.pk).order_by('-criacao')
        paginator = AvaliacaoSmallPagination()
        page = paginator.paginate_queryset(avaliacoes, request, view=self)

        if page is not None:
            serializer = AvaliacaoSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = AvaliacaoSerializer(avaliacoes, many=True)
        return Response(serializer.data)


class AvaliacaoViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet para gerenciamento de avaliações de cursos."""

    queryset = Avaliacao.objects.select_related('curso').all()
    serializer_class = AvaliacaoSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('nome', 'comentario', 'curso__titulo')
    ordering_fields = ('id', 'avaliacao', 'criacao')


# Autenticação por Token
class LoginAPIView(APIView):
    """Autentica um usuário e retorna seu token + dados básicos."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': 'Informe username e password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {'detail': 'Credenciais inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class RegisterAPIView(APIView):
    """Cria uma nova conta de usuário e retorna o token de acesso."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class MeAPIView(APIView):
    """Retorna os dados do usuário autenticado via Token/Session."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)
