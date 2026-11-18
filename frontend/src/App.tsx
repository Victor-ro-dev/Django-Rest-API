import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  LogIn,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { CourseFormModal } from './components/CourseFormModal';
import { StarRating } from './components/StarRating';
import { api, getStoredToken, setStoredToken } from './services/api';
import type { Curso, User } from './types/api';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null | undefined>(undefined);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api
      .me()
      .then(setUser)
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCursos({
        page,
        search: searchQuery || undefined,
        ordering,
      });
      setCursos(data.results);
      setTotalCount(data.count);
      setHasNext(Boolean(data.next));
      setHasPrev(Boolean(data.previous));

      if (selectedCurso) {
        const updated = data.results.find((c) => c.id === selectedCurso.id);
        if (updated) setSelectedCurso(updated);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar à API Django.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, ordering, selectedCurso]);

  useEffect(() => {
    fetchCursos();
  }, [page, searchQuery, ordering]);

  function handleLogout() {
    setStoredToken(null);
    setUser(null);
  }

  async function handleDeleteCurso(curso: Curso) {
    if (!window.confirm(`Deseja realmente excluir o curso "${curso.titulo}"?`)) {
      return;
    }
    try {
      await api.deleteCurso(curso.id);
      await fetchCursos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir curso.');
    }
  }

  const avgGeral =
    cursos.length > 0
      ? cursos.reduce((acc, c) => acc + c.media_avaliacoes, 0) / cursos.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Escola API
              </h1>
              <p className="text-xs text-slate-400">
                Catálogo de Cursos & Avaliações (DRF + React)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://127.0.0.1:8000/api/docs/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white sm:inline-flex"
            >
              Swagger API
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs">
                  {user.is_superuser && (
                    <span title="Superusuário">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </span>
                  )}
                  <span className="font-medium text-slate-200">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
              >
                <LogIn className="h-4 w-4" />
                Entrar / Registrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Métricas rápidas */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Cursos Cadastrados
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Média da Página
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="text-3xl font-bold text-white">
                {avgGeral.toFixed(1)}
              </span>
              <StarRating value={avgGeral} size="md" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Permissões Ativas
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {user
                ? user.is_superuser
                  ? 'Administrador (CRUD completo)'
                  : 'Autenticado (Criar/Editar e Avaliar)'
                : 'Visitante (Somente Leitura)'}
            </p>
          </div>
        </section>

        {/* Barra de busca e ações */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar cursos por título ou URL..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500"
              />
            </div>

            <select
              value={ordering}
              onChange={(e) => {
                setPage(1);
                setOrdering(e.target.value);
              }}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="id">Mais antigos</option>
              <option value="-criacao">Mais recentes</option>
              <option value="titulo">Título (A–Z)</option>
              <option value="-media_avaliacoes_avg">Melhor avaliados</option>
            </select>
          </div>

          <button
            onClick={() => (user ? setEditingCurso(null) : setShowAuthModal(true))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Novo Curso
          </button>
        </section>

        {/* Erro */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <strong>Erro:</strong> {error}. Verifique se o servidor Django está rodando
            em <code className="rounded bg-rose-950/60 px-1.5 py-0.5">http://127.0.0.1:8000</code>.
          </div>
        )}

        {/* Lista de cursos */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50"
              />
            ))}
          </div>
        ) : cursos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
            <h2 className="mt-3 text-base font-semibold text-white">
              Nenhum curso encontrado
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {searchQuery
                ? 'Tente outro termo na busca.'
                : 'Cadastre o primeiro curso para começar.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => (
              <article
                key={curso.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        curso.ativo
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {curso.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-xs text-slate-500">#{curso.id}</span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">
                    {curso.titulo}
                  </h3>

                  <a
                    href={curso.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <span className="truncate">{curso.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                <div className="mt-5 space-y-4 border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating value={curso.media_avaliacoes} />
                      <span className="text-sm font-semibold text-slate-200">
                        {curso.media_avaliacoes.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {curso.total_avaliacoes}{' '}
                      {curso.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCurso(curso)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ver Avaliações
                    </button>

                    {user && (
                      <button
                        onClick={() => setEditingCurso(curso)}
                        title="Editar curso"
                        className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}

                    {user?.is_superuser && (
                      <button
                        onClick={() => handleDeleteCurso(curso)}
                        title="Excluir curso (somente superusuário)"
                        className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginação */}
        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span className="text-sm text-slate-400">Página {page}</span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modais */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedUser) => setUser(loggedUser)}
        />
      )}

      {editingCurso !== undefined && (
        <CourseFormModal
          curso={editingCurso}
          onClose={() => setEditingCurso(undefined)}
          onSaved={fetchCursos}
        />
      )}

      {selectedCurso && (
        <CourseDetailModal
          curso={selectedCurso}
          user={user}
          onClose={() => setSelectedCurso(null)}
          onReviewChanged={fetchCursos}
          onRequireAuth={() => setShowAuthModal(true)}
        />
      )}
    </div>
  );
}

export default App;
