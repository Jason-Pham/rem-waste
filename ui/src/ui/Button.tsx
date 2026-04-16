import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-bold tracking-wide ' +
    'min-h-[48px] min-w-[48px] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 disabled:active:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-none';
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md hover:shadow-lg hover:shadow-brand-500/20 hover:-translate-y-0.5 border border-brand-600'
      : 'bg-white text-navy-900 border-2 border-navy-800 hover:bg-navy-900 hover:text-white shadow-sm';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
