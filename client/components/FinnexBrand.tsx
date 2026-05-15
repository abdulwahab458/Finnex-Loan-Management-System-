type FinnexBrandProps = {
  compact?: boolean;
  subtitle?: string;
  className?: string;
};

export default function FinnexBrand({ compact = false, subtitle, className = '' }: FinnexBrandProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(14,165,233,0.95),rgba(15,23,42,0.95))] shadow-[0_0_30px_rgba(56,189,248,0.35)]">
        <span className="text-2xl font-black tracking-[-0.08em] text-white">F</span>
      </div>
      <div className="leading-none">
        <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-black tracking-[-0.08em] text-transparent bg-clip-text bg-[linear-gradient(90deg,#f8fafc,rgba(125,211,252,0.95),#ffffff)]`}>
          Finnex
        </div>
        {subtitle ? <div className="mt-1 text-xs uppercase tracking-[0.28em] text-cyan-100/60">{subtitle}</div> : null}
      </div>
    </div>
  );
}