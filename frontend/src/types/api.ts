export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Curso {
  id: number;
  titulo: string;
  url: string;
  criacao: string;
  ativo: boolean;
  avaliacoes: number[];
  media_avaliacoes: number;
  total_avaliacoes: number;
}

export interface Avaliacao {
  id: number;
  curso: number;
  nome: string;
  comentario: string;
  avaliacao: string;
  criacao: string;
  ativo: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CursoPayload {
  titulo: string;
  url: string;
  ativo?: boolean;
}

export interface AvaliacaoPayload {
  curso: number;
  nome: string;
  email: string;
  comentario: string;
  avaliacao: number;
}
