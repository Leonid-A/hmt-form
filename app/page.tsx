import Image from "next/image";

import { PropertyForm } from "@/components/PropertyForm";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-3xl justify-center px-4 py-6 sm:px-6 sm:py-8">
          <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <Image
              src="/logo.jpg"
              alt={siteConfig.brandName}
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </span>
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
