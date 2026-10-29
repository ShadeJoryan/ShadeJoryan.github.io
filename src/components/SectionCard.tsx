import type { ReactNode } from 'react';

type SectionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ eyebrow, title, description, children, className = '' }: SectionCardProps) {
  return (
    <section className={`section-card ${className}`}>
      <header className="section-card__header">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="field-grid">{children}</div>
    </section>
  );
}
