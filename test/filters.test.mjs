import test from 'node:test';
import assert from 'node:assert/strict';
import {filterOffers,matchesPlatform} from '../public/filters.mjs';
const rows=[{id:'s',title:'Steam sale',store:'Steam',price:4.99,currency:'USD',discount:75,kind:'sale',category:'Giochi'},{id:'g',title:'GOG sale',store:'GOG',price:5,currency:'USD',discount:50,kind:'sale',category:'Giochi'},{id:'e',title:'Euro',store:'GOG',price:3,currency:'EUR',discount:80,kind:'sale',category:'Giochi'},{id:'f',title:'Gift',store:'Steam, GOG',price:0,currency:'USD',kind:'giveaway',category:'Giochi'}];
test('sotto 5 esclude il limite e non mescola valute',()=>assert.deepEqual(filterOffers(rows,{maxPrice:'5'}).map(x=>x.id),['s','f']));
test('combina Steam, prezzo, sconto e categoria senza includere bonus',()=>assert.deepEqual(filterOffers(rows,{platform:'Steam',maxPrice:'10',minDiscount:75,category:'Giochi'}).map(x=>x.id),['s']));
test('EUR non converte USD, omaggi validi in entrambe le fasce',()=>assert.deepEqual(filterOffers(rows,{maxPrice:'5',currency:'EUR'}).map(x=>x.id),['e','f']));
test('piattaforme multiple e alias corretti',()=>{assert.ok(matchesPlatform(rows[3],'GOG'));assert.ok(matchesPlatform({store:'PlayStation 5'},'PlayStation'));assert.equal(matchesPlatform({store:'Steam'},'GOG'),false)});
test('preferiti rispettano tutti i filtri e ordinamento non muta dati',()=>{assert.deepEqual(filterOffers(rows,{view:'saved',saved:new Set(['s','g']),platform:'GOG'}).map(x=>x.id),['g']);filterOffers(rows,{sort:'title'});assert.equal(rows[0].id,'s')});
