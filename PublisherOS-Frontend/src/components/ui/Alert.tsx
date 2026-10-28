import React from 'react';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
}

const styles: Record<AlertVariant, string> = {
  error: 'bg-[hsl(0_72%_46%/.08)] border border-[hsl(0_72%_46%/.3)] text-[hsl(0_72%_36%)]',
  success: 'bg-[hsl(142_76%_36%/.08)] border border-[hsl(142_76%_36%/.3)] text-[hsl(142_76%_26%)]',
  info: 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]',
};

export function Alert({ variant = 'info', title, children }: AlertProps) {
  return (
    <div className={`rounded-[var(--radius)] px-4 py-3 text-[13px] ${styles[variant]}`} role={variant === 'error' ? 'alert' : 'status'}>
      {title && <p className="font-medium mb-0.5">{title}</p>}
      <p>{children}</p>
    </div>
  );
}
