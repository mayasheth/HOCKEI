import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B3ZLJuYm.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DFFMxAlR.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Rival Watch - Feed", "activePage": "feed" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-2xl mx-auto px-4 py-6"> <!-- Header --> <div class="flex justify-end mb-4"> <button id="refresh-btn" class="btn px-3 py-1.5 text-sm font-medium rounded-lg" style="background-color: var(--accent-red); color: white;">
Refresh
</button> </div> <!-- Loading State --> <div id="loading" class="flex flex-col items-center justify-center py-20"> <div class="spinner w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mb-4"></div> <p style="color: var(--text-secondary);">Loading your rivals' misfortune...</p> </div> <!-- Empty State --> <div id="empty" class="hidden text-center py-20"> <p class="text-xl mb-2" style="color: var(--text-secondary);">No rivals selected</p> <p class="mb-6" style="color: var(--text-muted);">Pick some teams you love to hate</p> <a href="/rivals" class="btn inline-block px-6 py-2 rounded-lg font-medium" style="background-color: var(--accent-red); color: white;">
Select rivals
</a> </div> <!-- No Events State --> <div id="no-events" class="hidden text-center py-20"> <p class="text-xl mb-2" style="color: var(--text-secondary);">Nothing to celebrate... yet</p> <p style="color: var(--text-muted);">Your rivals haven't suffered recently</p> </div> <!-- Events Feed --> <div id="feed" class="hidden space-y-4"></div> </div> ` })} ${renderScript($$result, "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/index.astro", void 0);

const $$file = "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
