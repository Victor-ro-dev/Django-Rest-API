import { memo } from 'react';
import { ExternalLink, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import type { Curso, User } from '../types/api';
import { StarRating } from './StarRating';

interface CourseCardProps {
  curso: Curso;
  user: User | null;
  onSelect: (curso: Curso) => void;
  onEdit: (curso: Curso) => void;
  onDelete: (curso: Curso) => void;
}

export const CourseCard = memo(function CourseCard({
  curso,
  user,
  onSelect,
  onEdit,
  onDelete,
}: CourseCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700">
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
            onClick={() => onSelect(curso)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ver Avaliações
          </button>

          {user && (
            <button
              onClick={() => onEdit(curso)}
              title="Editar curso"
              className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {user?.is_superuser && (
            <button
              onClick={() => onDelete(curso)}
              title="Excluir curso (somente superusuário)"
              className="rounded-xl border border-slate-800 p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
