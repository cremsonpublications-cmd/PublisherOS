import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-[hsl(var(--foreground))]"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{hint}</p>
      )}
      {error && (
        <p className="text-[12px] text-[hsl(var(--destructive))]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
