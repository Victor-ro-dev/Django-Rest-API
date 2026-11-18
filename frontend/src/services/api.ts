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
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v2';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

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
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export interface ListCursosParams {
  page?: number;
  search?: string;
  ordering?: string;
  signal?: AbortSignal;
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

  me: (signal?: AbortSignal) => request<User>('/auth/me/', { signal }),

  // Cursos
  listCursos: ({ page, search, ordering, signal }: ListCursosParams = {}) => {
    const query = new URLSearchParams();
    if (page) query.set('page', String(page));
    if (search) query.set('search', search);
    if (ordering) query.set('ordering', ordering);
    const qs = query.toString();
    return request<PaginatedResponse<Curso>>(`/cursos/${qs ? `?${qs}` : ''}`, { signal });
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
  listCursoAvaliacoes: (cursoId: number, page = 1, signal?: AbortSignal) =>
    request<PaginatedResponse<Avaliacao>>(`/cursos/${cursoId}/avaliacoes/?page=${page}`, {
      signal,
    }),

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
