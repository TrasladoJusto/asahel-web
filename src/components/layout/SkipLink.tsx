import { cn } from '@/lib/utils';

interface SkipLinkProps {
  targetId?: string;
}

export function SkipLink({ targetId = 'main-content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'skip-link',
        'font-mono text-sm font-medium'
      )}
    >
      Saltar al contenido principal
    </a>
  );
}