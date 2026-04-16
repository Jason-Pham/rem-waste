import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ' +
    'min-h-[44px] min-w-[44px] transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  const styles =
    variant === 'primary'
      ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:hover:bg-brand-600'
      : 'bg-white text-brand-700 border border-brand-600 hover:bg-brand-50';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
