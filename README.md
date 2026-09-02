# keSTUDIO Scout OS

Ostrá prevádzka. Žiadne ukážkové firmy.

Scout kontroluje web naživo, pripraví e-mail a pustí ho von až po tvojom schválení. Dáta ostávajú v prehliadači (nie na serveri).

## Ako začať

1. Otvor **Web** a vlož adresu e-shopu.
2. Skontroluj nález a text.
3. **Schváľ**, až potom **Pošli**.

Odosielanie vypneš v **Nastaveniach**. Denný strop je 35 e-mailov zo `scout@kestudio.sk`.

## Nasadenie

Vercel stavia `npm run build`. Kľúč Mistral (ak ho používaš) daj do premenných prostredia na Verceli ako `MISTRAL_API_KEY`. Nikdy ho nedávaj do kódu.

## Príkazy

```
npm install
npm run dev
npm run typecheck
npm run build
```
