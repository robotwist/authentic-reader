# The Daily Authentic

**The day's most-covered stories, read closely for logic, rhetoric, and framing.**

[authentic-reader.netlify.app](https://authentic-reader.netlify.app) · [How it works](https://authentic-reader.netlify.app/method) · [RSS](https://authentic-reader.netlify.app/feed.xml) · [Case study](docs/CASE_STUDY.md)

Every morning the Daily Authentic selects the five stories that the most outlets, across the political spectrum, chose to cover. For each one it reads a single article line by line, checks its key claims against independent sources, and sets it beside other outlets' versions of the same event. Each article is analyzed once, the result is stored, and every reader sees the same analysis.

---

## The process

### 1. Selection

Stories are chosen by coverage, not by preference.

| Parameter | Value |
|---|---|
| Sources | 35 feeds from 27 outlets, rated left, center-left, center, right, or international; seven permit republishing with attribution |
| Window | Headlines from the previous 36 hours; opinion and commentary excluded |
| Grouping | Headlines that share distinctive terms (rarer terms weighted more) join the group they most resemble at a similarity of 0.30 or higher |
| Ranking | One point per distinct outlet, plus half a point per distinct part of the spectrum; groups need at least two outlets |
| Selection | Five stories on five different subjects; at most one may have fewer than three outlets |
| Continuity | A story that continues one covered in the past 30 days keeps its name and record |
| Article | From the most neutral-rated outlet in the group with at least 1,500 characters and 250 words; roundups skipped |
| Comparison | Up to four other outlets from the group, spread across the spectrum |

### 2. Reading

Each article is read against the same rubric every day, and the output is held to fixed rules:

- **Exact quotes only.** Every quoted passage is matched against the article text. Near-misses are replaced with the sentence sharing at least 75% of its words; anything not found is removed.
- **The outlet, not its sources.** Rhetoric inside a quotation belongs to the speaker unless the outlet adopts it in its own voice.
- **Nothing is padded.** Careful reporting can come back with no techniques found.
- **Calibrated scores.** 90–100 exemplary · 70–89 solid · 50–69 notable slant or omissions · below 50 misleading.
- **Numbers keep their baseline.** A missing comparison group is reported as an omission, never filled in.
- **Background is labeled.** Recent history comes only from the article or the archive.

### 3. Fact checks

Up to three factual claims per story are quoted exactly and searched for in independent coverage and primary sources. The original outlet and syndicated copies of the same article do not count as confirmation, and predictions and opinions are not checked. Results are *supported*, *contradicted*, *disputed*, *needs context*, or *no source found*, each with links.

### 4. The story so far

Each continuing story keeps a running record built only from the archive: a dated timeline, claims that independent sources confirmed, open questions that are marked answered when a later article answers them, and how outlets have framed it.

The full methodology, including limits, is published at [/method](https://authentic-reader.netlify.app/method).

---

## How it runs

The site is a React front end with the briefing pipeline in Netlify Functions. There is no server to maintain.

- **Schedule.** `briefing-cron` runs at 5 AM, 10 AM, and 3 PM Central and starts `generate-briefing-background`, which has up to 15 minutes per run.
- **Staged runs.** Each run finishes anything pending from the previous day, then completes whatever is missing for today. A step that cannot finish waits for the next run; an edition publishes once at least three stories are complete.
- **Storage.** Results live in Netlify Blobs. Visitor requests only read stored results, so traffic never triggers new analysis.

```
netlify/
  lib/
    sources.mjs      feeds, outlet ratings, article extraction
    stories.mjs      headline grouping, ranking, and daily selection
    analysis.mjs     article reading, quote grounding, fact checks, comparisons
    dossier.mjs      the story-so-far record
    briefing.mjs     the staged daily run
    pipeline.test.mjs
  functions/
    briefing-cron.mjs, generate-briefing-background.mjs
    daily-briefing.mjs   /api/daily-briefing, /api/story/:key, archive, status
    analysis.mjs         /api/analysis/* (stored analyses only)
    feed.mjs             /feed.xml
    submissions.mjs      /api/subscribe, /api/report
    hit.mjs              /api/hit (reader counts)
src/
  pages/        DailyBriefingPage, MethodPage
  components/   reader view, analysis panel, comparison, story so far, subscribe
```

`/api/daily-briefing/status` reports the most recent run.

## Development

```bash
npm install
npm run dev             # front end at localhost:5173
npm run test:pipeline   # pipeline unit tests
npm run typecheck
npm run build
```

Netlify builds run the tests and the typecheck before building, so a failing check never deploys.

### Configuration

Set in Netlify's environment variables:

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Key for the analysis service |
| `BRIEFING_SECRET` | Shared secret that protects the generation endpoint |
| `CURRENT_CONTEXT` | Optional. Current facts (such as who holds major offices) given to every reading |
| `BRIEFINGS_STORE` | Optional. Alternate storage name, used by preview deploys |

To start a run by hand:

```bash
curl -X POST -H "x-briefing-secret: $BRIEFING_SECRET" \
  https://authentic-reader.netlify.app/.netlify/functions/generate-briefing-background
```

### Reader submissions

Email signups (`/api/subscribe`) and error reports (`/api/report`) are validated, rate-limited, and stored in a private Netlify Blobs store, `reader-submissions`. To export them as CSV with your Netlify CLI login:

```bash
npm run export:subscribers > subscribers.csv
npm run export:reports > reports.csv
```

### Email edition

The morning edition is emailed through [Buttondown](https://buttondown.com/wistrand) by the `Email edition` GitHub Actions workflow, which runs after the 5 AM and 10 AM Central pipeline runs, reads the published edition from the site, and sends it once (Buttondown's record of sent emails prevents duplicates). It needs a `BUTTONDOWN_API_KEY` repository secret. To send yourself a preview, run the workflow manually with an address in `preview_to`. Signups from the site are added to Buttondown with a confirmation email; `npm run email:sync` pushes any that were stored before the email service was connected.

### Reader counts

Visits are counted without cookies or identifiers (see the methodology page). `npm run stats` prints daily readers, returning readers, page views, and the most-read stories; `npm run stats -- 60` covers 60 days.

The `authentic-reader-backend/` directory is the previous server-based version and is not deployed.

## License

MIT. See [LICENSE](LICENSE).
