# Upgrade markers

When to move off each free plan. `npm run stats` checks all three markers and prints what, if anything, to do. The visitor figures are estimates from measured page sizes and the published rates below; replace them with real numbers from the Netlify usage page after the first busy week.

## The three services

| Service | Free limit | What uses it up | First paid step |
| --- | --- | --- | --- |
| Netlify (hosting) | 300 credits a month; the site pauses at zero | The three daily pipeline runs, visitors, production deploys | Personal, $9 a month for 1,000 credits; extra credits $5 per 500 |
| Groq (analysis) | 200,000 tokens per model per day | Analyzing, comparing, and fact-checking each day's stories | Developer plan, pay as you go: about $0.15 per million input tokens and $0.60 per million output tokens on the main model |
| Buttondown (email) | 100 subscribers | Confirmed subscribers | Basic, $9 a month up to 1,000 |

Visitors never cost analysis: each article is analyzed once and the stored result is served to everyone. Groq usage grows only with the number of stories and checks per day, not with readers.

## Netlify: readers per day

Published rates: 20 credits per GB of bandwidth, 2 credits per 10,000 requests, 10 credits per GB-hour of function compute (functions run with 1 GB, so a function running for an hour costs 10 credits), 15 credits per production deploy.

Measured costs:

- **Pipeline:** each of the three daily runs takes up to about 10 minutes (the 5 AM run on November 12 took 9.5), so about 25 to 30 minutes a day, or roughly **125 credits a month**. The functions mostly wait on the analysis service, and waiting is billed.
- **A reader's visit,** after the November 18 bandwidth fix: about 0.25 MB (the page, today's briefing, a story or two), around 15 requests, and a few short function calls. Roughly **0.01 credits**, so about 90 reader-visits per credit.
- **Before the fix,** a first visit downloads about 4 MB (the 1 MB logo and 2.9 MB of files cached for offline use), about 0.08 credits. That is why there is no public launch before November 18.
- **Deploys:** about two a month, 30 credits.

| Setup | Credits left for readers | Readers a month | Readers a day |
| --- | --- | --- | --- |
| Free, as now | about 145 | about 13,000 | about 430 |
| Free, pipeline moved to GitHub Actions | about 270 | about 24,000 | about 800 |
| Personal ($9) | about 845 | about 76,000 | about 2,500 |

The markers, by seven-day average of daily readers:

1. **150 a day:** check the Netlify usage page weekly, and compare it against these estimates.
2. **300 a day:** move the daily pipeline to GitHub Actions, which is free for this public repository and returns about 125 credits a month to readers. Plan for Personal.
3. **400 a day, or the usage page shows 80% used before the 20th:** move to Personal and turn on auto recharge. On the free plan the site goes dark when credits run out.
4. **Any single day over 1,000** (a post took off): check the usage page that day.

## Groq: analysis quality

The free allowance is per model per day. When the main model runs out, stories fall back to smaller models, and fact-checks stop when the search model runs out. The run report at `/api/daily-briefing/status` records which model analyzed each story and the tokens used.

The marker: **most days in a week show a story on a fallback model, a used-up allowance, or a model above 90% of its allowance.** Then move to the Developer plan. At the current five stories a day, about 300,000 tokens, that is roughly $2 to $5 a month, the smallest upgrade with the largest effect on quality. It also allows more fact-checks per story and a sixth story.

As of November 12 the fact-checking model already used its whole allowance in one run, so this marker is likely to be reached first.

## Buttondown: subscribers

1. **80 confirmed subscribers:** plan for Basic.
2. **100:** move to Basic ($9 a month up to 1,000).

## Order, if everything grows at once

1. Groq Developer, a few dollars a month, as soon as fallbacks become routine.
2. Buttondown Basic at 100 subscribers.
3. Move the pipeline to GitHub Actions (free) at about 300 readers a day.
4. Netlify Personal at about 400 readers a day.

Prices checked November 12, 2026 on each service's pricing page.
