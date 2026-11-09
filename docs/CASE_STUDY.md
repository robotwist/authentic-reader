# Case study: rebuilding The Daily Authentic

**[authentic-reader.netlify.app](https://authentic-reader.netlify.app)** · November 2026

The Daily Authentic is a daily news briefing that selects the most-covered stories of the day, reads one article on each line by line for logic, rhetoric, and framing, checks its key claims against independent sources, and sets it beside other outlets' coverage of the same event. This is how I took it from a broken prototype to a working publication in two days, on free infrastructure.

---

## The starting point

A LinkedIn post had sent about 600 visitors to the site, but none of them saw the product. Both server apps behind it had been shut down, so every visitor got a banner reading "demo data" over five placeholder headlines. The service the analysis depended on had retired the configuration it used, so a restored server would have failed anyway. And new builds from the repository no longer deployed.

The goal was a site worth visiting every morning, at no ongoing cost.

## What I found when I audited the output

Getting the pipeline running again was only the first step. I measured what it produced and found that it looked thorough but did not hold up:

- **Quotes were not in the articles.** Of 19 quoted passages, 4 appeared word for word in the article they were quoting.
- **Results were templated.** Every article was assigned exactly two "manipulation techniques," and four of five had the same 70% confidence score.
- **"Verified" meant nothing.** Claims were labeled verified without being checked against any source.
- **Normal reporting was penalized.** Quoting an official was flagged as an "appeal to authority," and a speaker's own words were attributed to the outlet.

For a site whose purpose is careful reading, these were the real problems to solve.

## The method

The fix was a process with stated parameters and hard checks, published in full on the site's [methodology page](https://authentic-reader.netlify.app/method).

**Selection by coverage, not preference.** Each morning the pipeline collects 36 hours of headlines from 28 feeds across 20 outlets, each rated left, center-left, center, right, or international. Headlines are grouped when they share distinctive terms, with rarer terms weighted more heavily. Groups score one point per outlet plus half a point per part of the spectrum, and five stories on different subjects are chosen. Fixed topics had produced stale, grab-bag stories; this produces the day's actual news, and every story comes with its own comparison set.

**Rules that cannot be argued with:**

- Every quote is matched against the article text. A near-miss is replaced with the article's real sentence if they share at least 75% of their words; anything else is removed.
- The outlet is judged on its own words, not the words of the people it quotes.
- Zero findings is a valid result. Nothing is padded.
- Scores follow a published scale, and percentages keep the baseline the article gives them.
- Fact checks count only independent sources: never the original outlet, never syndicated copies. Predictions and opinions are not checked.

**Knowledge that accumulates.** Each continuing story keeps a record built only from the archive: a dated timeline, claims that independent sources confirmed, and open questions that are marked answered when a later article answers them. That record feeds the next day's reading, so recent context comes from the site's own checked history rather than stale reference material.

## Results

From the first edition under the new process (November 9, 2026):

| Measure | Before | After |
|---|---|---|
| Quoted passages found word for word in the article | 4 of 19 | 26 of 26 |
| Articles with exactly two "techniques" | 5 of 5 | 0 of 5 (three had one, two had none) |
| Stories with a cross-outlet comparison | 0 of 5 | 5 of 5 |
| Claims checked against independent sources | 0 | 12, with 9 supported |

That morning's edition was chosen from 388 headlines grouped into 39 multi-outlet stories. The five selected ranged from 2 to 14 outlets of coverage; the Nvidia story, covered by 14 outlets across the spectrum, shows the comparison at its most useful, with the same allegation described as a "relationship with suspected Chinese spy" (BBC News), a "target of foreign intelligence" (The Guardian), and "targeted by Chinese intelligence" (Washington Times).

## Engineering under constraints

Everything runs on free tiers: Netlify Functions, Netlify Blobs for storage, and an analysis service with daily quotas per processing tier.

- **No server, no per-visitor cost.** Each article is analyzed once and stored, and every reader gets the stored result. Traffic never triggers new processing.
- **Staged runs that survive limits.** The pipeline runs three times a day. Each run finishes the previous day's pending work first, completes whatever is missing for today, and moves to a fallback tier when one reaches its daily quota. An edition publishes once at least three stories are complete; otherwise the previous edition stays up.
- **Checks that gate every deploy.** Unit tests cover quote grounding, headline grouping, outlet matching, story records, submissions, and visitor counting. Tests and a typecheck run on every commit, in CI, and in the Netlify build, so a failing check cannot deploy.
- **Cleanup.** I removed a retired server stack, unused services, deployment scripts for platforms no longer in use, and a committed credential. The repository went from 718 to 235 tracked files, and the build from about 12 seconds to 3.
- **Privacy by default.** Readers are counted without cookies or identifiers: the browser keeps only the date of its last visit, and Do Not Track is honored. Signups and error reports are validated, rate-limited, and stored privately.

## What I would do next

- Measure return visits for a few weeks; a daily product succeeds or fails on whether people come back.
- Add per-story share images, so a shared link shows that story's headline.
- Launch an email edition from the existing RSS feed once a sending domain is in place.

## Stack

React and TypeScript front end; Node.js pipeline in Netlify Functions (scheduled and background); Netlify Blobs for storage; RSS ingestion and Readability-based article extraction; Node's built-in test runner; GitHub Actions for CI.

Source: [github.com/robotwist/authentic-reader](https://github.com/robotwist/authentic-reader)
