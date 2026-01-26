import{g as m,a as c,b as y,f}from"./teamColors.DzE4hYD2.js";function u(e){return e?e.replace(/-/g," ").replace(/\s*shot$/i,""):null}function v(e){const t=m(e.teamAbbreviation),s=u(e.shotType);return`
    <div class="card goal-card overflow-hidden" style="border-left: 3px solid ${t.primary};">
      <!-- Header bar -->
      <div class="flex items-center justify-between px-4 py-2" style="background: ${t.primary}10; border-bottom: 1px solid ${t.primary}20;">
        <span class="text-sm tracking-wider uppercase">
          <span class="headline font-bold" style="color: ${t.primary};">${e.teamAbbreviation}</span>
          <span style="color: var(--text-muted);"> • Goal Against</span>
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs" style="color: var(--text-muted);">${e.period} ${e.timeInPeriod}</span>
          ${e.strength&&e.strength!=="ev"?`
            <span class="text-xs px-1.5 py-0.5 rounded uppercase font-semibold"
              style="background: ${e.strength==="sh"?`linear-gradient(135deg, ${c}, #c62828)`:"rgba(255,255,255,0.1)"}; color: white;">
              ${e.strength==="pp"?"PP":e.strength==="sh"?"SHG":e.strength.toUpperCase()}
            </span>
          `:""}
        </div>
      </div>
      <!-- Body -->
      <div class="p-4">
        <div class="flex items-center gap-4">
          <!-- Rival logo (victim) - large with team color underglow -->
          <div class="relative flex-shrink-0">
            <div class="absolute inset-0 rounded-full" style="background: radial-gradient(circle, ${t.primary}50 0%, transparent 70%); filter: blur(12px); transform: translateY(4px);"></div>
            <img
              src="/logos/${e.teamAbbreviation.toLowerCase()}.png"
              alt="${e.teamName}"
              class="relative w-14 h-14 object-contain"
              style="opacity: 0.6; filter: saturate(0.7);"
            />
          </div>
          <!-- Arrows pointing at rival -->
          <div class="flex items-center gap-1" style="color: ${c};">
            <span style="font-size: 10px;">◀</span>
            <span style="font-size: 10px;">◀</span>
            <span style="font-size: 10px;">◀</span>
          </div>
          <!-- Scorer info -->
          <div class="flex items-center gap-2">
            <img
              src="/logos/${e.opponentAbbreviation.toLowerCase()}.png"
              alt="${e.opponentName}"
              class="w-6 h-6 object-contain"
            />
            <div>
              <p class="text-sm font-medium" style="color: var(--text-primary);">${e.scorerName}</p>
              <p class="text-xs" style="color: var(--text-muted);">${s||""}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function x(e){const t=m(e.teamAbbreviation);return`
    <div class="card loss-card overflow-hidden" style="border-left: 3px solid ${t.primary};">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2" style="background: ${t.primary}10; border-bottom: 1px solid ${t.primary}20;">
        <span class="text-sm tracking-wider uppercase">
          <span class="headline font-bold" style="color: ${t.primary};">${e.teamAbbreviation}</span>
          <span style="color: var(--text-muted);"> • Defeated</span>
        </span>
        <span class="text-xs" style="color: var(--text-muted);">Final</span>
      </div>
      <!-- Body -->
      <div class="p-5">
        <div class="flex items-center justify-between">
          <img
            src="/logos/${e.teamAbbreviation.toLowerCase()}.png"
            alt="${e.teamName}"
            class="w-14 h-14 object-contain"
            style="opacity: 0.35; filter: saturate(0.5) grayscale(0.3);"
          />
          <div class="flex items-center gap-3">
            <span class="headline text-3xl font-bold tabular-nums" style="color: var(--text-muted);">${e.rivalScore}</span>
            <div class="flex items-center gap-1" style="color: ${c};">
              <span style="font-size: 10px;">◀</span>
              <span style="font-size: 10px;">◀</span>
              <span style="font-size: 10px;">◀</span>
            </div>
            <span class="headline text-3xl font-bold tabular-nums" style="color: var(--text-primary);">${e.opponentScore}</span>
          </div>
          <img
            src="/logos/${e.opponentAbbreviation.toLowerCase()}.png"
            alt="${e.opponentName}"
            class="w-14 h-14 object-contain"
          />
        </div>
      </div>
    </div>
  `}function b(e){return`
    <div class="flex items-center gap-3 py-2">
      <div class="h-px flex-1" style="background-color: rgba(255,255,255,0.1);"></div>
      <span class="text-xs font-medium tracking-wider" style="color: var(--text-muted);">${e}</span>
      <div class="h-px flex-1" style="background-color: rgba(255,255,255,0.1);"></div>
    </div>
  `}const r=document.getElementById("loading"),p=document.getElementById("empty"),l=document.getElementById("no-events"),d=document.getElementById("feed"),h=document.getElementById("refresh-btn");function $(e){const t=new Date(e),s=new Date,a=new Date(s.getFullYear(),s.getMonth(),s.getDate()),n=new Date(t.getFullYear(),t.getMonth(),t.getDate()),o=Math.floor((a.getTime()-n.getTime())/(1e3*60*60*24));return o===0?"TODAY":o===1?"YESTERDAY":t.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"}).toUpperCase()}function w(e){const t=new Map;for(const s of e){const a=$(s.timestamp);t.has(a)||t.set(a,[]),t.get(a).push(s)}return t}async function g(){const e=y();if(r.classList.remove("hidden"),p.classList.add("hidden"),l.classList.add("hidden"),d.classList.add("hidden"),e.size===0){r.classList.add("hidden"),p.classList.remove("hidden");return}try{const t=await f(e,3);if(r.classList.add("hidden"),t.length===0){l.classList.remove("hidden");return}const s=w(t);let a="";for(const[n,o]of s){a+=b(n);for(const i of o)i.type==="loss"?a+=x(i):a+=v(i)}d.innerHTML=a,d.classList.remove("hidden")}catch(t){console.error("Failed to load feed:",t),r.classList.add("hidden"),l.classList.remove("hidden")}}g();h?.addEventListener("click",g);
