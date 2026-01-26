import { e as createComponent, k as renderComponent, l as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B3ZLJuYm.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DFFMxAlR.mjs';
export { renderers } from '../renderers.mjs';

const $$Rivals = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Rival Watch - Select Rivals", "activePage": "rivals" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-2xl mx-auto px-4 py-6"> <!-- Header --> <div class="flex items-center justify-between mb-6"> <div> <h1 class="text-2xl font-bold" style="color: var(--text-primary);">Select Rivals</h1> <p class="text-sm mt-1" style="color: var(--text-secondary);"> <span id="count">0</span> teams selected
</p> </div> <button id="clear-btn" class="btn px-3 py-1.5 text-sm font-medium rounded-lg" style="background-color: rgba(255,255,255,0.1); color: var(--text-secondary);">
Clear all
</button> </div> <!-- Loading State --> <div id="loading" class="flex flex-col items-center justify-center py-20"> <div class="spinner w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mb-4"></div> <p style="color: var(--text-secondary);">Loading teams...</p> </div> <!-- Team List --> <div id="team-list" class="hidden space-y-1"></div> </div> ` })} ${renderScript($$result, "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/rivals.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/rivals.astro", void 0);

const $$file = "/Users/shethm/Documents/nhl-rivals/random-nhl/src/pages/rivals.astro";
const $$url = "/rivals";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Rivals,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
