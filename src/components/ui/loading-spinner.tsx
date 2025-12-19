import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const loadingSpinnerVariants = cva(
  'animate-spin rounded-full border-b-2 border-primary',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  className,
  text,
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <div className={loadingSpinnerVariants({ size })} />
      {text && (
        <p className="text-muted-foreground ml-2">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;