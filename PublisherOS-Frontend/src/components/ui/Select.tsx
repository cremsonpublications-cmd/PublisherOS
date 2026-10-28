import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full h-9 px-3 rounded-[var(--radius)] text-[14px]
          bg-white border text-[hsl(var(--foreground))]
          appearance-none cursor-pointer
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--input))]'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
