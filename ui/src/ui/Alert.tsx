import type { ReactNode } from 'react';

type Props = {
  variant: 'error' | 'info';
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function Alert({ variant, title, children, actions }: Props) {
  const styles =
    variant === 'error'
      ? 'bg-red-50 border-red-300 text-red-900'
      : 'bg-blue-50 border-blue-300 text-blue-900';
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`border rounded-md p-4 ${styles}`}
    >
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="text-sm">{children}</div>
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </div>
  );
}
