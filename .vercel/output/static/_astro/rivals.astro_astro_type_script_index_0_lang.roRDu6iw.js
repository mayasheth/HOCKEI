import{b as m,c as v,d,g as u,a as s,t as p}from"./teamColors.DzE4hYD2.js";const c=document.getElementById("loading"),l=document.getElementById("team-list"),f=document.getElementById("clear-btn"),i=document.getElementById("count");let o=m();function b(){i&&(i.textContent=o.size.toString())}function h(t){const e=o.has(t.abbreviation);return u(t.abbreviation),`
      <button
        class="team-row w-full flex items-center gap-4 p-3 rounded-lg text-left"
        data-abbrev="${t.abbreviation}"
        style="background-color: ${e?"rgba(205, 92, 92, 0.15)":"transparent"};"
      >
        <img
          src="/logos/${t.abbreviation.toLowerCase()}.png"
          alt="${t.name}"
          class="w-10 h-10 object-contain"
        />
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate" style="color: var(--text-primary);">
            ${t.name}
          </p>
          <p class="text-sm" style="color: var(--text-muted);">
            ${t.abbreviation}
          </p>
        </div>
        <div
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          style="border-color: ${e?s:"rgba(255,255,255,0.3)"}; background-color: ${e?s:"transparent"};"
        >
          ${e?`
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `:""}
        </div>
      </button>
    `}function g(t){l&&(l.innerHTML=t.map(h).join(""),b())}function y(t){const e=t.target.closest(".team-row");if(!e)return;const n=e.dataset.abbrev;if(!n)return;o=p(n);const a=o.has(n);u(n),e.style.backgroundColor=a?"rgba(205, 92, 92, 0.15)":"transparent";const r=e.querySelector(".w-6.h-6");r&&(r.style.borderColor=a?s:"rgba(255,255,255,0.3)",r.style.backgroundColor=a?s:"transparent",r.innerHTML=a?`
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `:""),b()}async function w(){try{const t=await d();c?.classList.add("hidden"),l?.classList.remove("hidden"),g(t),l?.addEventListener("click",y)}catch(t){console.error("Failed to load teams:",t),c&&(c.innerHTML=`
          <p style="color: var(--accent-red);">Failed to load teams</p>
          <button onclick="location.reload()" class="btn mt-4 px-4 py-2 rounded-lg" style="background-color: var(--accent-red); color: white;">
            Retry
          </button>
        `)}}f?.addEventListener("click",async()=>{o=v();const t=await d();g(t)});w();
