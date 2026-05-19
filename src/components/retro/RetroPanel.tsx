type RetroPanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

/*
  Reusable retro panel component.
*/
export function RetroPanel({ title, children, className = "" }: RetroPanelProps) {
  return (
    <section className={`retro-panel ${className}`}>
      <div className="panel-title">{title}</div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
