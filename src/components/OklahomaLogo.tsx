import { cn } from '@/lib/utils';

interface OklahomaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light' | 'color';
}

const sizes = {
  sm: { outer: 32, text: 'text-sm' },
  md: { outer: 44, text: 'text-base' },
  lg: { outer: 64, text: 'text-xl' },
};

export function OklahomaLogo({ className, size = 'md', variant = 'light' }: OklahomaLogoProps) {
  const s = sizes[size];
  const isDark = variant === 'dark';
  const isColor = variant === 'color';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Shield / State Icon */}
      <div
        style={{ width: s.outer, height: s.outer }}
        className={cn(
          'rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg',
          isColor ? 'bg-gradient-oklahoma' : isDark ? 'bg-primary' : 'bg-white/20 backdrop-blur-sm border border-white/30'
        )}
      >
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ width: s.outer * 0.65, height: s.outer * 0.65 }}>
          {/* Stylized Oklahoma shape / graduation cap */}
          <path d="M20 4L36 12V22C36 30 28 36 20 38C12 36 4 30 4 22V12L20 4Z"
            fill="currentColor" fillOpacity="0.25" />
          <path d="M20 4L36 12V22C36 30 28 36 20 38C12 36 4 30 4 22V12L20 4Z"
            stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" fill="none" />
          {/* Star */}
          <circle cx="20" cy="20" r="4" fill="currentColor" fillOpacity="0.9" />
          <path d="M20 13L21.5 17.5H26L22.5 20.5L24 25L20 22L16 25L17.5 20.5L14 17.5H18.5L20 13Z"
            fill="white" fillOpacity="0.95" />
        </svg>
      </div>

      {/* Text */}
      <div className={isDark ? 'text-foreground' : 'text-white'}>
        <div className={cn('font-bold leading-tight', s.text)}>Oklahoma</div>
        <div className={cn('font-medium opacity-80 leading-tight', size === 'lg' ? 'text-base' : 'text-xs')}>
          K-12 Connect
        </div>
      </div>
    </div>
  );
}
