/**
 * Europe "Engineering Spec" eyebrow: a mono section number + label.
 * `01 · CATALOG`. Used to head bento sections / inner blocks.
 */
export function SectionNumber({
  n,
  children,
  className = "",
}: {
  n: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground ${className}`}>
      <span className="text-primary">{n}</span>
      <span className="h-px w-6 bg-border" />
      <span>{children}</span>
    </div>
  );
}
