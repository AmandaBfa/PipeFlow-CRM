import { CountUp } from "./count-up";
import { Reveal } from "./reveal";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}

// Números fictícios de resultado (prova social).
const STATS: Stat[] = [
  { value: 47, prefix: "+", suffix: "%", label: "de conversão" },
  { value: 3.2, suffix: "x", decimals: 1, label: "mais leads qualificados" },
  { value: 62, prefix: "-", suffix: "%", label: "no ciclo de venda" },
  { value: 1200, suffix: "+", label: "times usando o PipeFlow" },
];

export function StatsBand() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container py-14">
        <Reveal className="mb-10 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resultados de quem usa o PipeFlow
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80} className="text-center">
              <p className="text-4xl font-semibold tracking-tight text-primary tabular-nums sm:text-5xl">
                <CountUp
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals ?? 0}
                />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
