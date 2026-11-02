import manual from '../../public/catalog.json' with { type: 'json' };
export const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
export function dealUrl(id){let raw=String(id);try{raw=decodeURIComponent(raw)}catch{}return 'https://www.cheapshark.com/redirect?dealID='+encodeURIComponent(raw)}
export const normalizeDeal = (d, stores) => ({id:`cs-${d.dealID}`,title:d.title,store:stores.get(String(d.storeID)) || 'Altro store',category:'Giochi',kind:Number(d.salePrice) === 0 ? 'free' : 'sale',price:Number(d.salePrice),original:Number(d.normalPrice),currency:'USD',discount:Math.round(Number(d.savings)),image:/^[0-9]+$/.test(String(d.steamAppID))?`https://cdn.akamai.steamstatic.com/steam/apps/${d.steamAppID}/header.jpg`:safeUrl(d.thumb),thumbnail:safeUrl(d.thumb),url:dealUrl(d.dealID),source:'CheapShark',expires:null});
export const normalizeGift = d => ({id:`gp-${d.id}`,title:d.title,store:d.platforms || 'PC',category:d.type === 'Loot' ? 'DLC e contenuti' : d.type === 'Early Access' ? 'Beta e prove' : 'Giochi',kind:d.type === 'Game' ? 'giveaway' : 'bonus',price:0,original:null,currency:'USD',discount:null,image:safeUrl(d.image),url:safeUrl(d.open_giveaway_url || d.gamerpower_url),source:'GamerPower',expires:d.end_date && d.end_date !== 'N/A' ? d.end_date : null});
let cache;
async function json(url) {const r=await fetch(url,{headers:{'User-Agent':'DealRadar/1.0 (Netlify offer aggregator)'},signal:AbortSignal.timeout(10000)});if(r.status===201)return [];if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
export async function loadOffers(fetchJson=json) {
 const cheap = async () => {
  const stores=await fetchJson('https://www.cheapshark.com/api/1.0/stores');
  const names=new Map(stores.map(s=>[String(s.storeID),s.storeName]));
  const feeds=[{name:'Altri store',query:''},...['Steam','GOG'].map(name=>({name,query:stores.find(s=>s.storeName.toLowerCase()===name.toLowerCase())?.storeID}))];
  const batches=await Promise.allSettled(feeds.map(async(f,i)=>{
   if(i>0&&!f.query)throw Error('Store non disponibile');
   return (await fetchJson('https://www.cheapshark.com/api/1.0/deals?pageSize=60&onSale=1&sortBy=DealRating'+(f.query?'&storeID='+encodeURIComponent(f.query):''))).map(d=>normalizeDeal(d,names));
  }));
  if(batches.every(b=>b.status==='rejected'))throw Error('Nessun feed disponibile');
  return {offers:batches.flatMap(b=>b.status==='fulfilled'?b.value:[]),coverage:feeds.map((f,i)=>({store:f.name,status:batches[i].status==='fulfilled'?'online':'unavailable'}))};
 };
 const results=await Promise.allSettled([cheap(),fetchJson('https://www.gamerpower.com/api/giveaways').then(rows=>rows.map(normalizeGift))]);
 const sources=results.map((r,i)=>({name:['CheapShark','GamerPower'][i],status:r.status==='fulfilled'?'online':'unavailable'}));
 const storeCoverage=results[0].status==='fulfilled'?results[0].value.coverage:['Steam','GOG'].map(store=>({store,status:'unavailable'}));
 const now=Date.now();
 const rows=[...(results[0].status==='fulfilled'?results[0].value.offers:[]),...(results[1].status==='fulfilled'?results[1].value:[]),...manual];
 const offers=rows.filter(o=>o.title&&safeUrl(o.url)&&Number.isFinite(o.price)&&(!o.expires||new Date(o.expires).getTime()>now));
 return {updatedAt:new Date().toISOString(),sources,storeCoverage,offers:[...new Map(offers.map(o=>[o.id,o])).values()]};
}
export async function handler() {
 try {if(!cache || Date.now()-cache.time>600000){const data=await loadOffers();if(data.sources.every(s=>s.status==='unavailable') && cache)return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({...cache.data,stale:true})};cache={time:Date.now(),data};}
 return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=60, s-maxage=600'},body:JSON.stringify(cache.data)};
 }catch{return {statusCode:503,body:JSON.stringify({error:'Offerte non disponibili. Riprova tra poco.'})};}
}
