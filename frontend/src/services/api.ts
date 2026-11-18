import type {
  AuthResponse,
  Avaliacao,
  AvaliacaoPayload,
  Curso,
  CursoPayload,
  PaginatedResponse,
  User,
} from '../types/api';

const TOKEN_STORAGE_KEY = 'escola_api_token';
const API_BASE = '/api/v2';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = extractErrorMessage(data) || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;

  const messages: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      messages.push(`${field}: ${value.join(', ')}`);
    } else if (typeof value === 'string') {
      messages.push(`${field}: ${value}`);
    }
  }
  return messages.length > 0 ? messages.join(' | ') : null;
}

export const api = {
  // Autenticação
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  me: () => request<User>('/auth/me/'),

  // Cursos
  listCursos: (params: { page?: number; search?: string; ordering?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.ordering) query.set('ordering', params.ordering);
    const qs = query.toString();
    return request<PaginatedResponse<Curso>>(`/cursos/${qs ? `?${qs}` : ''}`);
  },

  createCurso: (payload: CursoPayload) =>
    request<Curso>('/cursos/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCurso: (id: number, payload: CursoPayload) =>
    request<Curso>(`/cursos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCurso: (id: number) =>
    request<void>(`/cursos/${id}/`, {
      method: 'DELETE',
    }),

  // Avaliações
  listCursoAvaliacoes: (cursoId: number, page = 1) =>
    request<PaginatedResponse<Avaliacao>>(`/cursos/${cursoId}/avaliacoes/?page=${page}`),

  createAvaliacao: (payload: AvaliacaoPayload) =>
    request<Avaliacao>('/avaliacoes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAvaliacao: (id: number) =>
    request<void>(`/avaliacoes/${id}/`, {
      method: 'DELETE',
    }),
};
