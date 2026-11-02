import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDeal,normalizeGift,safeUrl,loadOffers,dealUrl} from '../netlify/functions/offers.mjs';
test('preserva valuta e link CheapShark obbligatorio',()=>{const d=normalizeDeal({dealID:'a/b',title:'Game',salePrice:'5.00',normalPrice:'10',savings:'50',storeID:'1',thumb:'https://example.com/image'},new Map([['1','Steam']]));assert.equal(d.price,5);assert.equal(d.currency,'USD');assert.equal(d.store,'Steam');assert.match(d.url,/dealID=a%2Fb/)});
test('bonus e beta non diventano giochi completi gratuiti',()=>{assert.equal(normalizeGift({id:1,title:'Loot',type:'Loot'}).kind,'bonus');assert.equal(normalizeGift({id:2,title:'Game',type:'Game'}).kind,'giveaway')});
test('rifiuta link eseguibili o non https',()=>{assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('http://example.com'),'');assert.equal(safeUrl('https://example.com/'),'https://example.com/')});
test('guasto parziale conserva la fonte funzionante e filtra scaduti',async()=>{const result=await loadOffers(async url=>{if(url.includes('cheapshark'))throw Error('offline');return [{id:1,title:'Expired',type:'Game',end_date:'2000-01-01',open_giveaway_url:'https://example.com'},{id:2,title:'Available',type:'Game',end_date:'N/A',open_giveaway_url:'https://example.com'}]});assert.equal(result.offers.length,1);assert.equal(result.offers[0].title,'Available');assert.equal(result.sources[0].status,'unavailable');assert.equal(result.sources[1].status,'online')});

test('richiede Steam e GOG separatamente e deduplica le offerte generali',async()=>{
 const calls=[];const result=await loadOffers(async url=>{calls.push(url);if(url.endsWith('/stores'))return [{storeID:'1',storeName:'Steam'},{storeID:'7',storeName:'GOG'}];if(url.includes('gamerpower'))return [];const gog=url.includes('storeID=7');return [{dealID:gog?'gog':'steam',title:gog?'GOG game':'Steam game',salePrice:'4',normalPrice:'10',savings:'60',storeID:gog?'7':'1',thumb:'https://example.com/image'}]});
 assert.ok(calls.some(u=>u.includes('storeID=1')));assert.ok(calls.some(u=>u.includes('storeID=7')));assert.equal(result.offers.length,2);assert.ok(result.storeCoverage.every(s=>s.status==='online'));
});
test('GOG non disponibile non nasconde Steam',async()=>{
 const result=await loadOffers(async url=>{if(url.endsWith('/stores'))return [{storeID:'1',storeName:'Steam'},{storeID:'7',storeName:'GOG'}];if(url.includes('gamerpower'))return [];if(url.includes('storeID=7'))throw Error('GOG offline');return [{dealID:'s',title:'Available',salePrice:'2',normalPrice:'4',savings:'50',storeID:'1'}]});
 assert.equal(result.offers.length,1);assert.equal(result.storeCoverage.find(s=>s.store==='GOG').status,'unavailable');assert.equal(result.storeCoverage.find(s=>s.store==='Steam').status,'online');
});

test('link CheapShark non codifica due volte gli ID già codificati',()=>{assert.equal(new URL(dealUrl('abc%2Fdef%3D')).searchParams.get('dealID'),'abc/def=');assert.equal(new URL(dealUrl('abc/def=')).searchParams.get('dealID'),'abc/def=')});
