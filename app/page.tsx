import { PropertyForm } from "@/components/PropertyForm";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {siteConfig.brandName.slice(0, 3).toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {siteConfig.brandName}
              </p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {siteConfig.heroTitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {siteConfig.heroTitle}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {siteConfig.heroSubtitle}
          </p>
        </section>

        <PropertyForm />
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        {siteConfig.footerNote}
      </footer>
    </div>
  );
}
