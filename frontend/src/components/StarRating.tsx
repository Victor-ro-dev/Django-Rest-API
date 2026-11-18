import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  size?: 'sm' | 'md';
}

export function StarRating({ value, size = 'sm' }: StarRatingProps) {
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`Nota ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;

        return (
          <span key={star} className="relative inline-flex">
            <Star className={`${iconClass} text-slate-700`} />
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : '50%' }}
              >
                <Star className={`${iconClass} fill-amber-400 text-amber-400`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
