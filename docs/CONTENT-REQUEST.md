# ECKY THUMP — What content to gather next, and the exact file formats

## Copy-and-send content brief

Act as an experienced UK comedy writer and independent editorial researcher for **ECKY THUMP v2.0 — Social Club**, a phone-and-TV party game for 3–12 invited players. Create **original**, genuinely funny cards rooted in British everyday life, with some Lancashire/Northern flavour: social clubs, village fêtes, chippies, school gates, work dos, family group chats, caravans, meat raffles, council notices, pub quizzes and Christmas chaos. Never copy an existing commercial party-card game, famous joke, social-media post or published deck. Avoid real people, trademarks/brand names, hate, slurs, bullying of protected groups and material involving minors in adult themes. Use UK spelling.

### Priority quantities for the remaining volume targets

1. **230 Family response cards** — noun phrases, 4–45 characters, playable in any blank, ideally immediately funny when read aloud.
2. **65 Family prompts across modes** — a mix of one-blank black cards and free-text prompts for The Turn, Crossed Wires, The Hard Sell and Last Orders. No more than 90 characters per prompt. A black card must contain exactly **one `_____`**.
3. **30 Cheeky response cards** — innuendo rather than explicit sex, max 45 characters.
4. **About 65 additional compulsory Last Orders words**, distributed across all ratings. Prefer short, punchy words not already used. (The original catalogue also has draft words awaiting review.)
5. **About 30 additional contract styles**, distributed across ratings. Each should be an understandable instruction for the answer's tone, rather than a new game rule.

These are **catalogue-volume gaps**, counting existing draft material, not a claim that all existing drafts have passed editorial approval. Only newly approved entries qualify for an approved-only build. After Dark answer-card quantity is already substantial; do not prioritise more adult answers yet. Send content in batches of **100 entries** so that I can read and approve the humour before publication.

### Required CSV 1: ordinary fill-in cards and response cards

Filename: `party_more_cards.csv`. UTF-8 CSV (Excel CSV UTF-8 is fine). The exact header is:

```csv
id,deck,card_type,text,pick
100001,Family-friendly,Answer (white),a trophy for the quietest karaoke,
100002,Family-friendly,Start (black),The club's new mascot is _____.,1
100003,Cheeky,Answer (white),a disastrous office party flirt,
```

Accepted `deck` values: `Family-friendly`, `Cheeky`, `Very adult`. Accepted `card_type` values: `Answer (white)` and `Start (black)`. For answers, leave `pick` empty. For prompts, enter `1` and use exactly one blank (`_____`); **do not provide `pick=2`**. Use a new unique numeric ID with up to six digits (start at 100001). Don't include title rows, category separators, formulas or commentary in the CSV. Quote a CSV cell with double quotes when it contains a comma; escape an embedded quote by doubling it. Avoid duplicate wording or the same first four words appearing more than three times.

### Required CSV 2: other round modes, compulsory words and contracts

Filename: `party_more_modes.csv`. This is a **review template**; the current ordinary-card importer does not yet import these additional kinds automatically. Header:

```csv
id,deck,kind,text
200001,Family-friendly,witPrompts,Invent a slogan for a hopeless village fête.
200002,Family-friendly,contextPrompts,Write an innocent line about a family barbecue.
200003,Family-friendly,doublePrompts,Advertise the world's least useful kitchen tool.
200004,Family-friendly,finalPrompts,Give your final speech as chairman of the club.
200005,Family-friendly,finalWords,teapot
200006,Cheeky,contracts,Answer like an overconfident wedding DJ.
```

Valid `kind` values: `witPrompts`, `contextPrompts`, `doublePrompts`, `finalPrompts`, `finalWords`, `contracts`. Prompt texts must be 90 characters or fewer. Make words and contracts individually distinct; contracts must not change game logic or scoring. Use sequential unique numeric IDs, starting at 200001. This separate structure prevents silently converting different kinds of prompts into black cards.

### Rights / provenance

For anything not newly written by you, include a third file, `sources.csv`, with header:

```csv
file_or_id,source_url_or_owner,creator,licence,commercial_use_allowed,attribution_required,notes
```

For original writing, a brief statement **"I wrote these cards and authorise their use, modification and publication in ECKY THUMP, including possible paid distribution"** is ideal. If your content is sourced from elsewhere, verify the licence permits adaptation and commercial publication; a card CSV being downloadable is not permission in itself. Avoid CC-NC and CC-ND material if the game might be sold or rewritten.

### Optional audio still needed

Our Maureen currently has 60 approved caption/script lines but **no recorded speech**. If recordings can be provided, use the exact IDs/filenames in `VOICE-LINES.md` and the voice manifest. Supply individual mono WAV recordings (48 kHz preferred) or OGG, no embedded music, consistent Northern English delivery, plus permission to use the performances in the game. Do not change filenames or the scripts without supplying a matching manifest update.

### Final quality checklist

No duplicates; UK English; original humour; correct age rating; one blank per black card; short noun-phrase answers; 100 entries per review batch; use the file headers literally. Do not treat generated/retrieved material as automatically licensed. Supply the files as downloadable CSVs, not a pasted table.

### Publishing status (23 October 2026)

The current approved overlay contains **650 texts**: 200 previously staged Family proposals, plus all 450 supplied cards. **37** supplied cards were adapted to satisfy the one-blank, 45-character and no-brand requirements; the original-versus-approved wording is in `editorial/approved-card-import-ledger.csv`. The legacy 1,200-entry source file is preserved for audit and rollback. Format approval does not independently verify original ownership/licence; retain source information if the game will be distributed publicly or commercially.
