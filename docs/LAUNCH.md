# Launch kit

The aim: people enjoy reading the news in a quiet, ad-free page, get told plainly when an article leans on a weak argument, and start noticing the patterns themselves. The site is for anyone who reads the news, especially readers who take it at face value. Every post below shows the tool doing that job on a real article rather than describing its features.

## Before posting anything

1. **Email edition sending.** The `BUTTONDOWN_API_KEY` repository secret is set and a manual run of the Email edition workflow with `preview_to` delivered a copy. Interested visitors need a way to come back.
2. **November 18 deploy live.** Netlify credits reset. One production deploy ships the critical read, the "watch for" line on every card, the bandwidth fix, and the email signup on the site.
3. **Bandwidth fix verified.** Traffic spends Netlify credits and the site pauses at zero, so a well-received post must not be expensive per visit. Check that the first page load is well under 1 MB after the deploy.

## Timing

1. **Day 1 (November 18 or 19): LinkedIn.** The audience that already sent 600 visits. One post, built on that morning's sharpest finding.
2. **Days 2 to 10: the daily "Watch for" post** on LinkedIn, and the same text on Facebook, Instagram, Bluesky, or Threads.
3. **Week 2: niche places,** one at a time: Hacker News, r/medialiteracy, media critics, newsletters. Spread out so each gets attention and the free tier is not hit all at once.

Links:

- Site: https://authentic-reader.netlify.app
- Email signup: https://buttondown.com/wistrand
- How it works: https://authentic-reader.netlify.app/method

## The daily post: "Watch for"

Each story's critical read opens with one finding: the single most important thing to notice about how the article is written, with the exact passage it rests on. That is the post. It is specific, it teaches one pattern, and the site produces a new one every morning.

Template:

> Watch for: [the finding, in plain words].
>
> [Outlet], on [the story]: "[the quoted passage]"
>
> [One sentence on why it matters to a reader.] The full article, how other outlets worded it, and the rest of today's critical read: [story link]

Example from November 9:

> Watch for: a patriotic appeal carried into the coverage.
>
> The story on Nvidia's investigation into its CEO gives prominent space to his statement: "I love our country and our company. I am committed to protecting Nvidia and supporting America's national security. I am proud and grateful to be an American"
>
> Repeating a subject's declaration of patriotism can pull attention away from the espionage questions the story is about. The full article, how other outlets worded it, and what each left out: [link]

When the finding is that the article is careful, post that too. It shows the method is not hunting for flaws, and it is what earns trust.

## The second format: "Same story, different words"

The comparison finds one concept that outlets described differently. Use it when the day's wording differences are sharper than the day's finding.

> Same story, different words. [One-line description of the event.]
>
> [Outlet A]: "[their words]"
> [Outlet B]: "[their words]"
> [Outlet C]: "[their words]"
>
> None of these is false. Each makes you notice something different. Full articles side by side: [story link]

Example from November 9:

> Same story, different words. Nvidia's board opened an investigation into its CEO.
>
> BBC News: "relationship with suspected Chinese spy"
> The Guardian: "target of foreign intelligence"
> Washington Times: "targeted by Chinese intelligence"
>
> None of these is false. Each makes you notice something different. Full articles side by side: [link]

## LinkedIn launch post

Open with that morning's finding, then the story of the site.

> [Today's "Watch for" example, as above.]
>
> That is from The Daily Authentic, a free daily news briefing I built. A few months ago I found that 600 people had visited it from a LinkedIn post, and every one of them saw a broken page. So I rebuilt it.
>
> Every morning it picks the five stories the most outlets, across the political spectrum, chose to cover. You read each article in full, in a quiet page with no ads or clutter, and before you start it tells you the one thing to watch for. It marks weak arguments with a fairer way to say the same thing, checks key claims against independent sources with links, and shows how other outlets worded the same event. One opinion column from each side is judged on how well it makes its case, not on its conclusion.
>
> The whole method, with its thresholds and limits, is published. Nothing to sign up for to read it. I would value your honest reaction, especially where you think it gets an article wrong.
>
> https://authentic-reader.netlify.app

Follow-up comment: "If you'd like it in your inbox each morning: https://buttondown.com/wistrand"

## Short version (Bluesky, Threads, Mastodon, X)

> A free daily news briefing that reads the five most-covered stories closely: the full articles in a quiet ad-free page, the one thing to watch for in each, weak arguments marked with fairer versions, claims checked with sources, and how each outlet worded the same story. The method is public. https://authentic-reader.netlify.app

## Hacker News (Show HN)

Post on a weekday morning, US Eastern time.

Title: `Show HN: A daily news briefing that tells you what to watch for in each article`

Text:

> The Daily Authentic picks the five stories covered by the most outlets each morning (headlines from 35 feeds are grouped by shared distinctive terms and ranked by outlet count and spread across the spectrum), then reads one full article per story against a fixed rubric and leads with the single most important thing to notice about how it is written. Quotes are checked against the article text by code and removed if they are not there; key claims are checked against independent sources; a claim is only marked contradicted when the source covers the same measure and period; and each story shows how other outlets described the same event.
>
> It runs entirely on free tiers: Netlify Functions and Blobs, three staged runs a day that survive daily quotas, and one analysis per article stored and served to everyone, so traffic never triggers new processing. The method, including its limits, is at /method. I would value criticism of the method most.

Be present in the comments for the first few hours; HN rewards a builder who answers questions directly.

## Niche places

- **r/medialiteracy, r/journalism:** ask for criticism of the method, with one finding as the example. Read each community's rules first; most remove self-promotion that is not framed as a request for feedback.
- **r/InternetIsBeautiful:** allows useful free sites; follow the title rules exactly.
- **Media critics and journalists on Bluesky:** people who write about framing. Reply with a finding on a story they are already discussing, not a cold link.
- **Newsletters about media and misinformation:** send the editor one striking finding and the link. They need material; a concrete example is more useful to them than an announcement.

## Not doing

- **Automated posting or commenting.** LinkedIn, Reddit, and Facebook ban it, accounts get suspended, and a site about honest reading loses its credibility the moment someone notices. Every post goes out by hand.
- **Partisan framing.** Posts point at how something is written, never at which side is right. Rotate outlets so no single outlet or side is the regular target.

## What to measure

Check weekly and write the numbers down; they are the case study's next chapter.

- Daily readers and the share who return (`npm run stats`)
- Email subscribers and open rate (Buttondown dashboard)
- Which stories and opinion columns get read
- Which posts sent visitors (LinkedIn post analytics)

## Limits to keep in mind

When to upgrade each service, and how many readers the free plans hold: [SCALING.md](SCALING.md). `npm run stats` prints the markers.

- Netlify free plan: 300 credits a month; each production deploy costs 15, and traffic and the pipeline spend the rest. The site pauses at zero. Batch changes, test on preview deploys (free), and check the usage page on any day a post takes off.
- Buttondown free plan: 100 subscribers. Reaching it is the signal to decide whether to pay.
