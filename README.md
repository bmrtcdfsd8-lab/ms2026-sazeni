# ⚽ MS2026 Sázení — Fotbalový světový pohár

Virtuální sázková aplikace pro Mistrovství světa ve fotbale 2026 (USA / Kanada / Mexiko).  
**Žádné skutečné peníze — pouze virtuální mince!**

---

## 🚀 Rychlý start

### 1. Instalace závislostí

```bash
npm install
```

### 2. Nastavení API klíčů (volitelné)

Zkopíruj `.env.example` jako `.env.local` a doplň klíče:

```bash
cp .env.example .env.local
```

```env
# Registrace zdarma na https://www.football-data.org/client/register
VITE_FOOTBALL_API_KEY=tvůj_klíč_zde

# Registrace zdarma na https://the-odds-api.com/#get-access
VITE_ODDS_API_KEY=tvůj_klíč_zde
```

> **Bez API klíčů** aplikace automaticky používá realistická mock data — funguje plně offline.

### 3. Spuštění

```bash
npm run dev
```

Aplikace běží na **http://localhost:5173**

---

## 🎮 Funkce

### Ekonomika
- Každý hráč začíná s **2000 mincemi**
- Zůstatek uložen v `localStorage` — přetrvává i po zavření prohlížeče
- Historie transakcí s časovými razítky

### Live data
- Živé výsledky z [football-data.org](https://www.football-data.org/) (volný tier)
- Kurzy z [the-odds-api.com](https://the-odds-api.com/) (volný tier)
- Automatický refresh každých **60 sekund**
- Živý badge na zápasech probíhajících právě teď

### Trhy

**Standardní:**
- Vítěz zápasu (1/X/2)
- BTTS — oba týmy skórují
- Over/Under 0.5 / 1.5 / 2.5 / 3.5 gólů
- Přesný výsledek
- Střelec prvního gólu
- Výsledek v poločase
- Dvojitá šance (1X / X2 / 12)

**Zábavné / Bizarní:**
- 🟥 Červená karta? (Ano/Ne)
- 🟨 Počet žlutých karet (Over/Under)
- 🧤 Brankář dá gól? (~250.00 kurz)
- ⏱️ Prodloužení?
- 📺 VAR změní výsledek?
- 😭 Hráč bude plakat v kameře?
- 🎩 Hattrick v zápase?
- 🤦 Vlastní gól?
- 5+ žlutých karet pro rozhodčí?
- ⚽ Penalty shootout? (jen vyřazovací fáze)
- 🟥 Trenér dostane červenou?
- První roh — který tým?
- Celkové rohy Over/Under

### Turnaj
- **Skupinové tabulky** — všech 12 skupin, klikni na tým → zobrazí jeho zápasy
- **Pavouk** (Bracket) — vizualizace vyřazovací fáze od kola 32
- Vlajky týmů přes [flagcdn.com](https://flagcdn.com)
- Barevné indikátory postupu (zelená / žlutá / červená)

### UI/UX
- 🌑 Tmavý režim (deep navy)
- 💡 Neonové akcenty (modrá, zelená, červená)
- Glassmorphism karty pro tiket
- Animovaný počítač mincí
- Sázkový lístek — přidej více sázek, vidíš celkovou výplatu
- Responzivní design (mobil + desktop)
- Skeleton loading obrazovky
- Toast notifikace při sázení a vypořádání
- 🎉 Konfety animace na výhru

---

## 📁 Struktura projektu

```
src/
├── components/
│   ├── betting/         # BetSlip, OddsButton, BetMarketsModal
│   ├── layout/          # Navbar, Layout
│   ├── matches/         # MatchCard
│   ├── tournament/      # GroupTable, Bracket
│   └── ui/              # CoinCounter, LiveBadge, Skeleton, TeamFlag
├── data/
│   ├── ms2026.js        # 48 týmů, 12 skupin, mock zápasy
│   └── mockOdds.js      # Generátor realistických kurzů
├── hooks/
│   ├── useAutoSettle.js # Automatické vypořádání sázek
│   ├── useConfetti.js   # Konfety animace
│   └── useLiveData.js   # Live data fetch + refresh
├── pages/
│   ├── Home.jsx         # Domovská stránka
│   ├── Tournament.jsx   # Skupiny + pavouk
│   ├── MyBets.jsx       # Přehled sázek
│   └── Settings.jsx     # Nastavení
├── services/
│   └── api.js           # football-data.org + the-odds-api.com
├── store/
│   └── useStore.js      # Zustand store (persistence via localStorage)
└── utils/
    ├── betting.js       # Definice trhů, zamykání sázek
    ├── cn.js            # Tailwind class merge util
    └── format.js        # Formátování dat, čísel, stavů
```

---

## 🛠️ Build pro produkci

```bash
npm run build
npm run preview
```

---

## 📝 Pravidla sázení

- **Minimální sázka:** 10 mincí
- **Maximální sázka:** celý zůstatek (all-in)
- **Kurzy:** Evropský decimální formát (např. 2.45)
- Sázky se **automaticky zamknou** po výkopu (status = IN_PLAY)
- Výplata = sázka × kurz

---

## ⚠️ Upozornění

Tato aplikace je čistě pro zábavu. Nevyužívá skutečné peníze, kreditní karty ani jakékoli platební metody. Veškerá data jsou lokální v prohlížeči.
