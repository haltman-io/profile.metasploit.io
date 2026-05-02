import type { LanguageStat } from "@/lib/github"

export function Languages({ languages }: { languages: LanguageStat[] }) {
  return (
    <section
      aria-labelledby="languages-title"
      className="flex max-w-md flex-col gap-4"
    >
      <h2
        id="languages-title"
        className="font-mono text-base font-semibold tracking-tight text-foreground"
      >
        Languages
      </h2>

      <div
        role="img"
        aria-label="Language distribution across public repositories"
        className="flex h-1.5 w-full overflow-hidden bg-muted/40"
      >
        {languages.map((l) => (
          <span
            key={l.name}
            style={{ width: `${l.pct}%`, backgroundColor: l.color }}
            className="block"
          />
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        {languages.map((l) => (
          <li
            key={l.name}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2 font-mono text-xs"
          >
            <span
              aria-hidden
              className="inline-block size-2"
              style={{ backgroundColor: l.color }}
            />
            <span className="text-foreground/85">{l.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {l.pct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
