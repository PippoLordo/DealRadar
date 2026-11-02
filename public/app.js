import {filterOffers,platforms} from './filters.mjs';
const $=s=>document.querySelector(s);
let offers=[],view='all',limit=24,saved=new Set();
try{const values=JSON.parse(localStorage.getItem('dealradar:saved')||'[]');if(Array.isArray(values))saved=new Set(values)}catch{}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function url(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}
function money(n,c){return new Intl.NumberFormat('it-IT',{style:'currency',currency:c||'USD'}).format(n)}
function image(o){const img=el('img');img.src=url(o.image);img.alt='';img.loading='lazy';let fallback=false;img.addEventListener('error',()=>{if(!fallback&&url(o.thumbnail)&&o.thumbnail!==o.image){fallback=true;img.src=o.thumbnail}else img.remove()});return img}
function prices(o){const box=el('div');if(o.original>o.price)box.append(el('span','old',money(o.original,o.currency)));box.append(el('span','price'+(o.price===0?' free':''),o.price===0?'Gratis':money(o.price,o.currency)));return box}
function offerLink(o){const a=el('a','deal-link','Vedi offerta ↗');a.href=url(o.url);a.target='_blank';a.rel='noopener noreferrer';return a}
function card(o){
 const c=el('article','card'),art=el('div','art');if(url(o.image))art.append(image(o));
 art.append(el('span','badge'+(o.kind==='bonus'?' bonus':''),o.kind==='sale'?`−${o.discount||0}%`:o.kind==='bonus'?'BONUS / BETA':o.kind==='giveaway'?'OMAGGIO':'GRATIS'));
 const heart=el('button','heart',saved.has(o.id)?'♥':'♡');heart.setAttribute('aria-label',`Preferito: ${o.title}`);heart.setAttribute('aria-pressed',String(saved.has(o.id)));
 heart.onclick=()=>{saved.has(o.id)?saved.delete(o.id):saved.add(o.id);try{localStorage.setItem('dealradar:saved',JSON.stringify([...saved]))}catch{}render()};art.append(heart);
 const body=el('div','card-body'),meta=el('div','meta');meta.append(el('span','store-pill',o.store),document.createTextNode(o.category));body.append(meta,el('h3','',o.title));const bottom=el('div','card-bottom');bottom.append(prices(o),offerLink(o));body.append(bottom);
 if(o.expires)body.append(el('small','expiry',`Scadenza indicata dalla fonte: ${o.expires}`));c.append(art,body);return c;
}
function featured(){
 const o=offers.find(o=>o.kind==='sale'&&o.image&&o.discount>=50)||offers.find(o=>o.image);
 if(!o){$('#featured').replaceChildren(el('div','feature-placeholder','Nessuna offerta disponibile'));return}
 const content=el('div','feature-content'),top=el('div','feature-top');top.append(el('span','', 'SUL RADAR'),el('span','',o.kind==='sale'?`−${o.discount}%`:'GRATIS'));
 content.append(top,el('div','meta',o.store),el('h2','',o.title));const bottom=el('div','card-bottom');bottom.append(prices(o),offerLink(o));content.append(bottom);$('#featured').replaceChildren(...(url(o.image)?[image(o)]:[]),content);
}
function options(){return {query:$('#search').value,platform:$('#platform').value,store:$('#store').value,category:$('#category').value,view,maxPrice:$('#price').value,minDiscount:Number($('#discount').value),currency:$('#currency').value,sort:$('#sort').value,saved}}
function render(){
 const state=options(),rows=filterOffers(offers,state);$('#grid').replaceChildren(...rows.slice(0,limit).map(card));
 if(!rows.length){const empty=el('div','empty',view==='saved'?'Nessun preferito con questi filtri. Salva le offerte con il cuore per ritrovarle qui.':'Nessuna offerta con questi filtri. Prova un’altra piattaforma o azzera i filtri.');$('#grid').append(empty)}
 $('#result-count').textContent=`${rows.length} risultati`;$('#saved-count').textContent=saved.size;$('#more').hidden=rows.length<=limit;
 $('#heading').textContent=state.category||state.platform||({all:'Tutte le offerte',giveaway:'Gratis e omaggi',sale:'In sconto',saved:'I tuoi preferiti'})[view];
 const active=[];if(state.maxPrice)active.push(`Meno di ${state.maxPrice} ${state.currency}`);if(state.minDiscount)active.push(`Sconto dal ${state.minDiscount}%`);if(state.platform)active.push(state.platform);if(state.store)active.push(state.store);if(state.category)active.push(state.category);
 $('#filter-description').textContent=active.length?active.join(' · '):'Prezzi originali della fonte · nessuna conversione stimata';
 document.querySelectorAll('[data-price]').forEach(b=>{b.textContent=`Sotto ${b.dataset.price} ${state.currency==='EUR'?'€':'$'}`;b.setAttribute('aria-pressed',String(state.maxPrice===b.dataset.price))});
 document.querySelectorAll('[data-discount]').forEach(b=>b.setAttribute('aria-pressed',String(state.minDiscount===Number(b.dataset.discount))));
 document.querySelector('[data-kind]').setAttribute('aria-pressed',String(view==='giveaway'));
 document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 document.querySelectorAll('[data-platform]').forEach(b=>b.classList.toggle('active',b.dataset.platform===state.platform));
}
async function load(){
 $('#refresh').disabled=true;$('#notice').textContent='';
 try{
  const r=await fetch('/api/offers');if(!r.ok)throw Error();const d=await r.json();offers=d.offers;
  $('#total').textContent=offers.length;$('#free').textContent=offers.filter(o=>['free','giveaway'].includes(o.kind)).length;
  const stores=[...new Set(offers.map(o=>o.store))].sort();$('#shops').textContent=stores.length;const previous=$('#store').value;
  $('#store').replaceChildren(new Option('Tutti gli store',''),...stores.map(s=>new Option(s,s)));$('#store').value=stores.includes(previous)?previous:'';
  $('#updated').textContent=`Aggiornato ${new Date(d.updatedAt).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`;
  $('#sources').replaceChildren(...[...d.sources,...(d.storeCoverage||[]).map(f=>({name:f.store,status:f.status}))].map(s=>el('p','',`${s.name}: ${s.status==='online'?'disponibile':'temporaneamente non disponibile'}`)));
  if(d.stale)$('#notice').textContent='Le fonti non rispondono: mostro l’ultimo aggiornamento disponibile.';
  else if(d.sources.some(s=>s.status!=='online')||(d.storeCoverage||[]).some(s=>s.status!=='online'))$('#notice').textContent='Alcune fonti non sono disponibili. I risultati sono parziali.';
  featured();render();
 }catch{ $('#notice').textContent='Impossibile aggiornare le offerte. Riprova tra poco.';if(!offers.length){$('#grid').replaceChildren(el('div','empty','Non ci sono dati disponibili. Premi Aggiorna per riprovare.'));$('#featured').replaceChildren(el('div','feature-placeholder','Radar temporaneamente offline'))}}
 finally{$('#refresh').disabled=false}
}
for(const p of platforms){$('#platform').append(new Option(p,p));if(['Steam','GOG','Epic Games Store','itch.io','Xbox','PlayStation'].includes(p)){const b=el('button','platform-nav',p);b.dataset.platform=p;b.onclick=()=>{$('#platform').value=$('#platform').value===p?'':p;limit=24;render()};$('#platform-nav').append(b)}}
for(const id of ['search','platform','store','category','price','currency','discount','sort'])$('#'+id).addEventListener(id==='search'?'input':'change',()=>{limit=24;render()});
for(const b of document.querySelectorAll('.nav'))b.onclick=()=>{view=b.dataset.view;limit=24;render()};
for(const b of document.querySelectorAll('[data-price]'))b.onclick=()=>{$('#price').value=$('#price').value===b.dataset.price?'':b.dataset.price;limit=24;render()};
for(const b of document.querySelectorAll('[data-discount]'))b.onclick=()=>{$('#discount').value=$('#discount').value===b.dataset.discount?'0':b.dataset.discount;limit=24;render()};
$('#reset').onclick=()=>{for(const id of ['search','platform','store','category','price'])$('#'+id).value='';$('#discount').value='0';$('#sort').value='default';view='all';limit=24;render()};
document.querySelector('[data-kind]').onclick=()=>{view=view==='giveaway'?'all':'giveaway';limit=24;render()};
$('#filter-toggle').onclick=()=>{const open=$('#advanced').hidden;$('#advanced').hidden=!open;$('#filter-toggle').setAttribute('aria-expanded',String(open))};
$('#more').onclick=()=>{limit+=24;render()};$('#refresh').onclick=load;render();load();setInterval(()=>{if(!document.hidden)load()},600000);
