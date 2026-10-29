# DealRadar

Webapp in italiano per raccogliere offerte e omaggi, pronta per GitHub + Netlify. Nessun account, database o chiave API richiesto. Tema scuro verde lime, responsive, ricerca, filtri per store e tipo, categorie, ordinamento, preferiti sul dispositivo e caricamento progressivo.

## Pubblicazione

1. Crea un repository GitHub e carica **il contenuto di questa cartella**, con `netlify.toml` nella radice.
2. Su Netlify scegli **Add new project → Import an existing project → GitHub** e seleziona il repository.
3. Directory di pubblicazione: `public`. Nessun comando di build. Funzioni: `netlify/functions` (configurazione già presente in `netlify.toml`). Usa Node 22 o successivo.
4. Pubblica. Ogni push su GitHub aggiornerà il sito attraverso l'integrazione Netlify.

Non usare il solo caricamento statico di `public`: l'aggregazione necessita della funzione server Netlify. Nessuna credenziale va inserita nel frontend.

## Avvio locale e test

```sh
npm test
npm run dev
```

Il secondo comando avvia un server locale Node senza dipendenze. Non è richiesto un framework o un build frontend. I test usano fixture: non creano account né effettuano acquisti.

## Copertura reale di questa versione

| Fonte | Dati | Limiti |
| --- | --- | --- |
| CheapShark | fino a 60 offerte PC per risposta, nomi degli store dalla fonte | prezzi USD, selezione e non catalogo completo; link di uscita CheapShark preservati |
| GamerPower | omaggi, DLC e beta su più piattaforme | selezione editoriale, non controllo integrale di ogni store; indicazioni di regione/abbonamento da verificare nella pagina originale |
| Catalogo editoriale | giochi e software, anche per store aggiuntivi | aggiornato manualmente da `public/catalog.json`, inizialmente vuoto |

Steam, GOG, Epic, itch.io, Xbox, PlayStation e mobile possono apparire quando presenti nei dati ricevuti. Non significa che ogni loro offerta sia monitorata. G2A, Instant Gaming e i cataloghi completi Microsoft Store / Google Play / console / software **non hanno ancora un connettore dedicato**. Non vengono simulati prezzi né inventate offerte. L'integrazione successiva richiede feed/API autorizzati e relativi accordi se necessari. Rivenditori e marketplace andranno distinti dagli store ufficiali quando integrati.

La categoria Software è predisposta, senza offerte precaricate. I filtri per categoria sono nella barra laterale e nel menu delle categorie, disponibile anche su telefono. Le categorie attuali sono Giochi, Software, DLC e contenuti, Beta e prove. Generi o sottocategorie non vengono inventati dai titoli: le fonti non danno una tassonomia completa affidabile.

## Aggiungere un'offerta software verificata

Inserisci un oggetto nell'array `public/catalog.json`, dopo aver verificato condizioni, prezzo e durata alla fonte:

```json
{
  "id": "identificatore-unico",
  "title": "Nome prodotto",
  "store": "Nome store",
  "category": "Software",
  "kind": "giveaway",
  "price": 0,
  "original": null,
  "currency": "EUR",
  "discount": null,
  "image": "https://dominio-autorizzato/immagine.jpg",
  "url": "https://pagina-ufficiale/offerta",
  "source": "Catalogo editoriale",
  "expires": "2027-01-01T23:59:59+01:00"
}
```

L'oggetto è solo uno schema: non rappresenta un'offerta reale. `kind`: `sale` (sconto), `giveaway` (omaggio), `free` (gratuito), `bonus` (DLC/beta). Usa scadenze ISO 8601 con fuso. I link devono essere HTTPS. Per `sale` indica prezzo, prezzo originale e sconto verificati.

## Aggiornamento e affidabilità

Le fonti vengono lette alla richiesta, con timeout di 10 secondi e cache server di 10 minuti. La pagina aggiorna i dati ogni 10 minuti mentre è aperta. Non sono presenti un controllo continuo a sito chiuso, cron, notifiche push/email o storico prezzi: non sono stati ancora configurati. Un errore di una fonte non elimina i risultati dell'altra; in caso di errore totale si riutilizza la cache se ancora disponibile nell'istanza server, segnalando dati vecchi. A istanza fredda senza fonti disponibili viene mostrato un avviso con zero risultati. Cache e disponibilità non sono persistenti.

I prezzi non vengono convertiti in euro. La destinazione originale resta il riferimento per valuta, area geografica, disponibilità e condizioni. Gli omaggi non equivalgono necessariamente a licenze perpetue: beta e bonus sono separati. Preferiti conservati solo nel browser; nessuna sincronizzazione.

## Fonti

- https://apidocs.cheapshark.com/
- https://www.gamerpower.com/api-read

Le attribuzioni sono visibili nel footer. I collegamenti CheapShark richiesti dalla fonte sono preservati. Non è stata usata IsThereAnyDeal: i termini richiedono valutazione specifica per un servizio di confronto offerte.
