import { e as createComponent, f as createAstro, n as renderHead, h as addAttribute, o as renderSlot, r as renderTemplate } from './astro/server_B3ZLJuYm.mjs';
import 'piccolore';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, activePage = "feed" } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description" content="Track negative events for NHL teams you love to hate"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><title>${title}</title>${renderHead()}</head> <body class="min-h-screen"> <!-- Navigation --> <nav class="fixed top-0 left-0 right-0 z-50 border-b" style="background-color: var(--bg-dark); border-color: var(--border-subtle);"> <div class="max-w-2xl mx-auto px-4"> <div class="flex items-center justify-between h-12"> <!-- Logo/Title --> <a href="/" class="text-base font-bold tracking-tight uppercase headline" style="color: var(--accent-red);">
Rival Watch
</a> <!-- Navigation Links --> <div class="flex gap-6"> <a href="/"${addAttribute(`nav-link text-sm font-medium ${activePage === "feed" ? "active" : ""}`, "class")}${addAttribute(`color: ${activePage === "feed" ? "var(--text-primary)" : "var(--text-secondary)"};`, "style")}>
Feed
</a> <a href="/rivals"${addAttribute(`nav-link text-sm font-medium ${activePage === "rivals" ? "active" : ""}`, "class")}${addAttribute(`color: ${activePage === "rivals" ? "var(--text-primary)" : "var(--text-secondary)"};`, "style")}>
Rivals
</a> </div> </div> </div> </nav> <!-- Main Content --> <main class="pt-12 min-h-screen"> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/Users/shethm/Documents/nhl-rivals/random-nhl/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
