import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from .models import Avaliacao, Curso


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def common_user(db):
    return User.objects.create_user(
        username='aluno',
        email='aluno@escola.com',
        password='password123',
    )


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(
        username='admin',
        email='admin@escola.com',
        password='adminpassword123',
    )


@pytest.fixture
def curso(db):
    return Curso.objects.create(
        titulo='Django REST Framework Completo',
        url='https://cursos.exemplo.com/drf',
    )


@pytest.mark.django_db
class TestCursosAPI:
    url = '/api/v2/cursos/'

    def test_listar_cursos_publico(self, api_client, curso):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['titulo'] == curso.titulo
        assert response.data['results'][0]['media_avaliacoes'] == 0
        assert response.data['results'][0]['total_avaliacoes'] == 0

    def test_criar_curso_sem_autenticacao_falha(self, api_client):
        payload = {'titulo': 'Python Avançado', 'url': 'https://cursos.exemplo.com/py'}
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_criar_curso_autenticado(self, api_client, common_user):
        api_client.force_authenticate(user=common_user)
        payload = {'titulo': 'Python Avançado', 'url': 'https://cursos.exemplo.com/py'}
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['titulo'] == payload['titulo']

    def test_deletar_curso_usuario_comum_proibido(self, api_client, common_user, curso):
        api_client.force_authenticate(user=common_user)
        response = api_client.delete(f'{self.url}{curso.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_deletar_curso_superuser_permitido(self, api_client, superuser, curso):
        api_client.force_authenticate(user=superuser)
        response = api_client.delete(f'{self.url}{curso.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Curso.objects.filter(id=curso.id).exists()

    def test_buscar_curso_por_titulo(self, api_client, curso):
        Curso.objects.create(titulo='React com TypeScript', url='https://cursos.exemplo.com/react')
        response = api_client.get(f'{self.url}?search=React')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['titulo'] == 'React com TypeScript'


@pytest.mark.django_db
class TestAvaliacoesAPI:
    url = '/api/v2/avaliacoes/'

    def test_criar_avaliacao_com_nota_decimal_valida(self, api_client, common_user, curso):
        api_client.force_authenticate(user=common_user)
        payload = {
            'curso': curso.id,
            'nome': 'Maria Silva',
            'email': 'maria@exemplo.com',
            'comentario': 'Excelente conteúdo prático!',
            'avaliacao': '4.5',
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['avaliacao'] == '4.5'

    @pytest.mark.parametrize('nota_invalida', ['0.5', '5.5', '6.0'])
    def test_rejeitar_nota_fora_do_intervalo(self, api_client, common_user, curso, nota_invalida):
        api_client.force_authenticate(user=common_user)
        payload = {
            'curso': curso.id,
            'nome': 'João',
            'email': 'joao@exemplo.com',
            'comentario': 'Teste',
            'avaliacao': nota_invalida,
        }
        response = api_client.post(self.url, payload)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_media_e_listagem_avaliacoes_do_curso(self, api_client, curso):
        Avaliacao.objects.create(
            curso=curso,
            nome='Ana',
            email='ana@exemplo.com',
            comentario='Muito bom',
            avaliacao='4.0',
        )
        Avaliacao.objects.create(
            curso=curso,
            nome='Carlos',
            email='carlos@exemplo.com',
            comentario='Perfeito',
            avaliacao='5.0',
        )

        curso_res = api_client.get(f'/api/v2/cursos/{curso.id}/')
        assert curso_res.status_code == status.HTTP_200_OK
        assert curso_res.data['media_avaliacoes'] == 4.5
        assert curso_res.data['total_avaliacoes'] == 2

        av_res = api_client.get(f'/api/v2/cursos/{curso.id}/avaliacoes/')
        assert av_res.status_code == status.HTTP_200_OK
        assert av_res.data['count'] == 2


@pytest.mark.django_db
class TestAuthAPI:
    def test_registro_login_e_me(self, api_client):
        register_res = api_client.post(
            '/api/v2/auth/register/',
            {
                'username': 'novousuario',
                'email': 'novo@escola.com',
                'password': 'password123',
            },
        )
        assert register_res.status_code == status.HTTP_201_CREATED
        assert 'token' in register_res.data
        assert register_res.data['user']['username'] == 'novousuario'

        login_res = api_client.post(
            '/api/v2/auth/login/',
            {'username': 'novousuario', 'password': 'password123'},
        )
        assert login_res.status_code == status.HTTP_200_OK
        token = login_res.data['token']

        api_client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me_res = api_client.get('/api/v2/auth/me/')
        assert me_res.status_code == status.HTTP_200_OK
        assert me_res.data['username'] == 'novousuario'
