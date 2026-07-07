export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
        PipeFlow CRM
      </span>

      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Seu pipeline de vendas,{" "}
        <span className="text-primary">simples e visual</span>
      </h1>

      <p className="max-w-xl text-lg text-muted-foreground">
        Gerencie leads, mova negócios pelo Kanban e feche mais vendas — sem a
        complexidade dos CRMs tradicionais.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="/signup"
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Criar conta grátis
        </a>
        <a
          href="/login"
          className="inline-flex h-11 items-center rounded-lg border border-border px-6 font-medium text-foreground transition-colors hover:bg-accent"
        >
          Entrar
        </a>
      </div>
    </main>
  );
}
