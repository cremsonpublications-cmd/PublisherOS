import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full h-9 px-3 rounded-[var(--radius)] text-[14px]
          bg-white border text-[hsl(var(--foreground))]
          placeholder:text-[hsl(var(--muted-foreground))]
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error
            ? 'border-[hsl(var(--destructive))]'
            : 'border-[hsl(var(--input))] hover:border-[hsl(var(--muted-foreground)/.4)]'
          }
          ${className}
        `}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
