export const platforms=['Steam','GOG','Epic Games Store','itch.io','Xbox','PlayStation','Android','iOS'];
export function matchesPlatform(offer,platform){
 if(!platform)return true;
 const text=(offer.store||'').toLowerCase();
 const patterns={'Steam':/\bsteam\b/,'GOG':/\bgog\b/,'Epic Games Store':/epic/,'itch.io':/itch/,'Xbox':/xbox/,'PlayStation':/playstation|\bps[45]\b/,'Android':/android|google play/,'iOS':/\bios\b/};
 return patterns[platform]?.test(text)||text===platform.toLowerCase();
}
export function filterOffers(offers,{query='',platform='',store='',category='',view='all',maxPrice='',minDiscount=0,currency='USD',sort='default',saved=new Set()}={}){
 const q=query.trim().toLocaleLowerCase('it');
 const rows=offers.filter(o=>(!q||`${o.title} ${o.store}`.toLocaleLowerCase('it').includes(q))&&matchesPlatform(o,platform)&&(!store||o.store===store)&&(!category||o.category===category)&&
  (view==='all'||view==='saved'&&saved.has(o.id)||view==='sale'&&o.kind==='sale'||view==='giveaway'&&['free','giveaway'].includes(o.kind))&&
  (maxPrice===''||(Number.isFinite(o.price)&&(o.price===0||o.currency===currency)&&o.price<Number(maxPrice)))&&
  (!minDiscount||o.kind==='sale'&&Number(o.discount)>=Number(minDiscount)));
 if(sort==='discount')rows.sort((a,b)=>(b.discount||0)-(a.discount||0));
 if(sort==='price')rows.sort((a,b)=>a.currency.localeCompare(b.currency)||a.price-b.price);
 if(sort==='title')rows.sort((a,b)=>a.title.localeCompare(b.title));
 return rows;
}
