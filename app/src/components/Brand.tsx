export default function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3 min-w-0">
    <img src={`${import.meta.env.BASE_URL}arqely-logo.png`} alt="Logo Arqely" className="h-10 w-10 shrink-0 object-contain bg-black rounded-lg" />
    <div><div className="text-sm font-semibold tracking-tight leading-tight">Arqely CRM</div>{!compact && <div className="text-[11px] opacity-60">Neo Move devient Arqely</div>}</div>
  </div>
}
