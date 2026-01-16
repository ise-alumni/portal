import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  name: string;
  color?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  name,
  color = '#3B82F6',
  variant = 'secondary',
  className
}) => {
  const customStyle = {
    backgroundColor: color + '20',
    borderColor: color,
    color: color
  };

  return (
    <Badge
      variant={variant}
      className={cn('text-xs', className)}
      style={variant === 'secondary' ? customStyle : undefined}
    >
      {name}
    </Badge>
  );
};

export default TagBadge;