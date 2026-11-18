import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquarePlus,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { Avaliacao, Curso, User } from '../types/api';
import { StarRating } from './StarRating';

interface CourseDetailModalProps {
  curso: Curso;
  user: User | null;
  onClose: () => void;
  onReviewChanged: () => void;
  onRequireAuth: () => void;
}

const NOTAS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function CourseDetailModal({
  curso,
  user,
  onClose,
  onReviewChanged,
  onRequireAuth,
}: CourseDetailModalProps) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [nome, setNome] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api
      .listCursoAvaliacoes(curso.id, page, controller.signal)
      .then((data) => {
        setAvaliacoes(data.results);
        setTotal(data.count);
        setHasNext(Boolean(data.next));
        setHasPrev(Boolean(data.previous));
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setAvaliacoes([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [curso.id, page, refreshTick]);

  const reloadReviews = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await api.createAvaliacao({
        curso: curso.id,
        nome,
        email,
        comentario,
        avaliacao: nota,
      });
      setComentario('');
      setPage(1);
      reloadReviews();
      onReviewChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview(id: number) {
    try {
      await api.deleteAvaliacao(id);
      reloadReviews();
      onReviewChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir avaliação.');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Avaliações de ${curso.titulo}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-xl font-bold text-white">{curso.titulo}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <StarRating value={curso.media_avaliacoes} />
                <strong className="text-slate-200">{curso.media_avaliacoes.toFixed(1)}</strong>
                <span>({total} avaliações)</span>
              </span>
              <a
                href={curso.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
              >
                Acessar curso
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Lista de avaliações */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Avaliações dos Alunos
            </h3>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Carregando avaliações...
              </p>
            ) : avaliacoes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
                Este curso ainda não possui avaliações. Seja o primeiro a avaliar!
              </div>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map((av) => (
                  <div
                    key={av.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{av.nome}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <StarRating value={Number(av.avaliacao)} />
                          <span className="text-xs text-slate-400">
                            {Number(av.avaliacao).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {user && (
                        <button
                          onClick={() => handleDeleteReview(av.id)}
                          title="Excluir avaliação"
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {av.comentario && (
                      <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                        {av.comentario}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(hasPrev || hasNext) && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                <span className="text-xs text-slate-500">Página {page}</span>
                <button
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  Próxima <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </section>

          {/* Formulário de nova avaliação */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquarePlus className="h-4 w-4 text-indigo-400" />
                Nova Avaliação
              </h3>
              {!user && (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="text-xs font-medium text-indigo-400 hover:underline"
                >
                  Faça login para avaliar
                </button>
              )}
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail (único por curso)"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Nota:</span>
                {NOTAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNota(n)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      nota === n
                        ? 'bg-amber-400 text-slate-950'
                        : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {n.toFixed(1)}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escreva o que achou do curso..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />

              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Publicar Avaliação'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
