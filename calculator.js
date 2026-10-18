(()=>{
 "use strict";
 const root=document.getElementById("page-calculator");
 if(!root)return;
 const rates={
  MIA:{name:"MortaLeague A",goal:40000,assist:30000,gym:40000,cup:2000000},
  ZMK:{name:"ZMK",goal:30000,assist:20000,gym:30000,cup:1500000},
  FA:{name:"FA Cup",goal:20000,assist:10000,gym:20000,cup:1000000},
  GOAT:{name:"GOAT Cup",goal:10000,assist:5000,gym:10000,cup:500000},
  SUPER:{name:"ML Süper Kupa",goal:10000,assist:5000,gym:10000,cup:250000},
  UCL:{name:"UEFA Şampiyonlar Ligi",goal:70000,assist:60000,gym:70000,cup:5000000},
  UEL:{name:"UEFA Avrupa Ligi",goal:60000,assist:50000,gym:60000,cup:4000000},
  UECL:{name:"UEFA Konferans Ligi",goal:50000,assist:40000,gym:50000,cup:3000000},
  USC:{name:"UEFA Süper Kupa",goal:50000,assist:40000,gym:50000,cup:3000000},
  WC:{name:"Dünya Kupası",goal:70000,assist:60000,gym:70000,cup:5000000},
  EURO:{name:"Avrupa Şampiyonası",goal:60000,assist:50000,gym:60000,cup:4000000},
  NL:{name:"UEFA Uluslar Ligi",goal:40000,assist:30000,gym:40000,cup:2500000}
 };
 const $=id=>document.getElementById(id);
 const tournament=$("valuecalc-tournament"),goals=$("valuecalc-goals"),assists=$("valuecalc-assists"),gym=$("valuecalc-gym"),cups=$("valuecalc-cups");
 const feedback=$("valuecalc-feedback");
 const money=n=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(n)+" €";
 const value=input=>{const n=Number(input.value);return Number.isFinite(n)&&n>0?Math.min(1000000000,Math.floor(n)):0};
 function setAmount(id,n){$(id).textContent=money(n)}
 function calculate(){
  const rate=rates[tournament.value]||rates.MIA;
  const count={goals:value(goals),assists:value(assists),gym:value(gym),cups:value(cups)};
  const part={goal:count.goals*rate.goal,assist:count.assists*rate.assist,gym:count.gym*rate.gym,cup:count.cups*rate.cup};
  $("valuecalc-goal-rate").textContent="Gol başına "+money(rate.goal);
  $("valuecalc-assist-rate").textContent="Asist başına "+money(rate.assist);
  $("valuecalc-gym-rate").textContent="Gym başına "+money(rate.gym);
  $("valuecalc-cup-rate").textContent="Kupa başına "+money(rate.cup);
  $("valuecalc-result-tournament").textContent=rate.name;
  $("valuecalc-total").textContent=money(part.goal+part.assist+part.gym+part.cup);
  setAmount("valuecalc-goal-total",part.goal);setAmount("valuecalc-assist-total",part.assist);setAmount("valuecalc-gym-total",part.gym);setAmount("valuecalc-cup-total",part.cup);
  return {rate,count,part,total:part.goal+part.assist+part.gym+part.cup};
 }
 [tournament,goals,assists,gym,cups].forEach(el=>{el.addEventListener("input",()=>{feedback.textContent="";calculate()});el.addEventListener("change",()=>{if(el!==tournament){const n=Number(el.value);el.value=Number.isFinite(n)&&n>0?String(Math.min(1000000000,Math.floor(n))):"0"}calculate()})});
 $("valuecalc-reset").addEventListener("click",()=>{goals.value="0";assists.value="0";gym.value="0";cups.value="0";feedback.textContent="";calculate()});
 $("valuecalc-copy").addEventListener("click",async()=>{
  const r=calculate();
  const text=["MortaLeague Oyuncu Değer Hesaplama",`Turnuva: ${r.rate.name}`,`Gol: ${r.count.goals} × ${money(r.rate.goal)} = ${money(r.part.goal)}`,`Asist: ${r.count.assists} × ${money(r.rate.assist)} = ${money(r.part.assist)}`,`Gym: ${r.count.gym} × ${money(r.rate.gym)} = ${money(r.part.gym)}`,`Kupa: ${r.count.cups} × ${money(r.rate.cup)} = ${money(r.part.cup)}`,`Toplam katkı değeri: ${money(r.total)}`].join("\n");
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}else{const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();const copied=document.execCommand("copy");ta.remove();if(!copied)throw new Error("copy failed")}feedback.textContent="Hesaplama sonucu kopyalandı."}
  catch(_){feedback.textContent="Kopyalama başarısız oldu. Sonucu elle seçip kopyalayabilirsin."}
 });
 calculate();
})();
