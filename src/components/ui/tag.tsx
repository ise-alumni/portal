import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface EventTag {
  tags: Tag;
}

const tagVariants = cva(
  "inline-flex items-center rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  tag: Tag;
  showColor?: boolean;
}

export const Tag: React.FC<TagProps> = ({ 
  tag, 
  variant, 
  className, 
  showColor = true,
  ...props 
}) => {
  const style = showColor ? {
    backgroundColor: tag.color + '20',
    borderColor: tag.color,
    color: tag.color
  } : undefined;

  return (
    <div
      className={cn(tagVariants({ variant }), className)}
      style={style}
      {...props}
    >
      {tag.name}
    </div>
  );
};

export default Tag;