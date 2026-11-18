# Escola API — Cursos & Avaliações (DRF + React)

Aplicação **Full-Stack** para gerenciamento de catálogo de cursos e avaliações de alunos, construída com **Django REST Framework (Python)** no backend e **React + TypeScript + Tailwind CSS (Vite)** no frontend.

---

## ✨ Funcionalidades

### Backend (Django REST Framework)
- **Versionamento de API:**
  - `api/v1/` — Views genéricas (`ListCreateAPIView`, `RetrieveUpdateDestroyAPIView`) com rotas aninhadas.
  - `api/v2/` — `ViewSets` e `SimpleRouter` com busca (`?search=`), ordenação (`?ordering=`) e paginação configurável (`?page_size=`).
- **Autenticação por Token (`rest_framework.authtoken`):**
  - Registro (`POST /api/v2/auth/register/`), login (`POST /api/v2/auth/login/`) e perfil (`GET /api/v2/auth/me/`).
- **Controle de Permissões:**
  - Leitura pública para visitantes (`IsAuthenticatedOrReadOnly`).
  - Criação/edição para usuários autenticados e exclusão de cursos restrita a superusuários (`EhSuperUser`).
- **Média e Validação de Notas:**
  - Cálculo otimizado da média de avaliações (`media_avaliacoes`) e contagem (`total_avaliacoes`) via `annotate` no queryset (sem N+1 queries).
  - Validação de notas entre `1.0` e `5.0` (incluindo decimais como `4.5`).
- **Documentação OpenAPI / Swagger:**
  - Swagger UI em `/api/docs/` e Redoc em `/api/redoc/` via `drf-spectacular`.
- **Testes Automatizados:**
  - Suíte completa com `pytest` e `pytest-django` em `cursos/tests.py`.

### Frontend (React + TypeScript)
- Catálogo de cursos com busca em tempo real, ordenação e paginação.
- Visualização de média em estrelas e listagem paginada de avaliações por curso.
- Modal de criação/edição de cursos e envio de avaliações (com notas de `1.0` a `5.0`).
- Fluxo de Login e Registro integrado ao Token da API.

---

## 🛠️ Tecnologias

- **Backend:** Python, Django, Django REST Framework, `django-cors-headers`, `drf-spectacular`, `pytest`, `pytest-django`
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Banco de Dados:** SQLite (desenvolvimento)

---

## 📂 Estrutura do Projeto

```text
Django-Rest-API/
├── cursos/                 # App Django (models, serializers, views, permissions, pagination, tests)
├── escola/                 # Configurações, URLs e WSGI/ASGI do projeto Django
├── frontend/               # Aplicação React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # AuthModal, CourseFormModal, CourseDetailModal, StarRating
│   │   ├── services/api.ts # Cliente HTTP integrado à API v2
│   │   ├── types/api.ts    # Interfaces TypeScript
│   │   └── App.tsx
│   └── vite.config.ts      # Proxy /api -> http://127.0.0.1:8000
├── .env.example            # Exemplo de variáveis de ambiente
├── pytest.ini              # Configuração do pytest-django
├── requirements.txt        # Dependências Python
└── manage.py
```

---

## 🚀 Como Executar Localmente

### 1. Backend (Django)

```powershell
# Crie e ative o ambiente virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instale as dependências
pip install -r requirements.txt

# (Opcional) Copie as variáveis de ambiente
copy .env.example .env

# Aplique as migrações e crie um superusuário (para poder excluir cursos)
python manage.py migrate
python manage.py createsuperuser

# Inicie o servidor
python manage.py runserver
```

A API estará disponível em `http://127.0.0.1:8000/api/v2/` e o Swagger em `http://127.0.0.1:8000/api/docs/`.

### 2. Frontend (React + TypeScript)

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

---

## 🧪 Executando os Testes

```powershell
pytest
```

---

## 📌 Principais Endpoints (v2)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/v2/auth/register/` | Cria conta e retorna Token |
| `POST` | `/api/v2/auth/login/` | Autentica e retorna Token |
| `GET` | `/api/v2/auth/me/` | Retorna dados do usuário autenticado |
| `GET` | `/api/v2/cursos/` | Lista cursos (suporta `?search=`, `?ordering=`, `?page=`) |
| `POST` | `/api/v2/cursos/` | Cria um novo curso (autenticado) |
| `PATCH` | `/api/v2/cursos/{id}/` | Atualiza um curso (autenticado) |
| `DELETE` | `/api/v2/cursos/{id}/` | Remove um curso (somente superusuário) |
| `GET` | `/api/v2/cursos/{id}/avaliacoes/` | Lista avaliações paginadas do curso |
| `POST` | `/api/v2/avaliacoes/` | Publica uma avaliação (autenticado) |
