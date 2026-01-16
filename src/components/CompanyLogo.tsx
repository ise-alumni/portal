import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const CompanyLogo = ({
  name,
  logoUrl,
  size = 'md',
  className,
}: CompanyLogoProps) => {
  const dimension = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          className={cn(
            'rounded-md object-contain bg-background',
            dimension
          )}
          onError={(e) => {
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <span className="text-sm font-medium truncate">{name}</span>
    </div>
  );
};

