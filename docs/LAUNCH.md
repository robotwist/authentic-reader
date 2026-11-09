# Launch kit

The aim: people enjoy reading the news in a quiet, ad-free page, notice when an argument is weak, and start recognizing the patterns themselves. Everything below points at that experience.

## Timing

1. **This week: quiet testing.** Share the classroom demo with five to ten teachers and a few friends who read a lot of news. Collect reactions; fix what confuses people.
2. **November 18: launch deploy.** Netlify credits reset. One production deploy ships the bandwidth fix, email signups on the site, the licensing changes, and the classroom lesson.
3. **November 18 or 19: the public push.** LinkedIn and personal socials first, then the channels below, spread over two weeks rather than all in one day.

Links to use:

- Site: https://authentic-reader.netlify.app
- Email signup: https://buttondown.com/wistrand
- Classroom demo (this week): https://classroom--authentic-reader.netlify.app/?story=nvidia-espionage-investigation&lesson=1
- How it works: https://authentic-reader.netlify.app/method

## The repeatable hook: "Same story, different words"

Each day the comparison finds one concept that outlets described differently. That is the most shareable thing the site produces: instantly understandable, nonpartisan, and it makes people curious. Post one every weekday.

Template:

> Same story, different words. [One-line description of the event.]
>
> [Outlet A]: "[their words]"
> [Outlet B]: "[their words]"
> [Outlet C]: "[their words]"
>
> None of these is false. Each makes you notice something different. Today's close reading, with the full articles side by side: [story link]

Example from November 9:

> Same story, different words. Nvidia's board opened an investigation into its CEO.
>
> BBC News: "relationship with suspected Chinese spy"
> The Guardian: "target of foreign intelligence"
> Washington Times: "targeted by Chinese intelligence"
>
> None of these is false. Each makes you notice something different. Today's close reading, with the full articles side by side: [link]

A second weekly format, "The strongest reply": quote one opinion column's thesis, then the strongest counterargument the analysis says it never answers. It shows the opinion feature judging arguments rather than sides.

## LinkedIn launch post

> A few months ago I built a news site that reads articles the way a careful editor would. Last week I found that 600 people had visited it from a LinkedIn post, and every one of them saw a broken page.
>
> So I rebuilt it. The Daily Authentic is now a free daily briefing:
>
> - Every morning it picks the five stories the most outlets, across the political spectrum, chose to cover.
> - You read each article in full, in a quiet page with no ads or clutter.
> - Passages that lean on weak arguments are marked, with a fairer way to say the same thing.
> - Key claims are checked against independent sources, with links.
> - You see how other outlets described the same event, side by side.
> - One opinion column from each side is scored on how well it makes its case, not on its conclusion.
>
> The whole method, with its thresholds and limits, is published. There are no ads and nothing to sign up for to read it.
>
> I would love your honest reaction, and if you teach, I would especially love to hear from you: each story now comes with a printable classroom lesson.
>
> https://authentic-reader.netlify.app

Follow-up comment with the email link: "If you'd like it in your inbox each morning: https://buttondown.com/wistrand"

## Short versions (Bluesky, Threads, Mastodon, X)

> Built a free daily news briefing: the five most-covered stories, the full articles in a quiet ad-free page, weak arguments marked with fairer versions, claims checked against independent sources, and how each outlet worded the same story. The method is public. https://authentic-reader.netlify.app

> Same story, different words: [daily example]. [link]

## Hacker News (Show HN)

Post on a weekday morning, US Eastern time, once the November 18 deploy is live.

Title: `Show HN: A daily news briefing that shows how outlets word the same story`

Text:

> The Daily Authentic picks the five stories covered by the most outlets each morning (headlines from 35 feeds are grouped by shared distinctive terms and ranked by outlet count and spread across the spectrum), then reads one full article per story against a fixed rubric. Quotes are checked against the article text by code and removed if they are not there; key claims are checked against independent sources; and each story shows how other outlets described the same event.
>
> It runs entirely on free tiers: Netlify Functions and Blobs, three staged runs a day that survive daily quotas, and one analysis per article stored and served to everyone, so traffic never triggers new processing. The method, including its limits, is at /method. I would value criticism of the method most.

Be present in the comments for the first few hours; HN rewards a builder who answers questions directly.

## Reddit

Read each community's rules first; most remove self-promotion that is not framed as a request for feedback.

- r/medialiteracy and r/journalism: ask for criticism of the method.
- r/SideProject and r/webdev: a build story post.
- r/InternetIsBeautiful: allowed format for useful free sites; follow their title rules exactly.
- r/Teachers: do not post a link cold; join the weekly self-promotion or resource threads, or ask whether a resource like this would be useful.

## Teachers

Who to reach: teachers you know, then friends of friends; school librarians; social studies and English departments; media-literacy groups such as the News Literacy Project, Media Literacy Now, and NAMLE (National Association for Media Literacy Education).

Message:

> Hi [name], I built a free tool that turns each day's top news stories into a short close-reading lesson: background and vocabulary, flagged passages for students to evaluate, a table of how five outlets worded the same event, discussion questions, and an answer key. Here is one: [classroom demo link]
>
> Would you be willing to look at it for five minutes and tell me whether you would use something like this, and what would make it fit your class? No sales pitch; it is free and I am trying to make it genuinely useful.

Questions to ask the teachers who reply:

1. Would you use this, and how often?
2. Which grade and subject does it fit best?
3. What would you change or add (length, reading level, a worksheet version)?
4. Would your school pay for a version that saves you prep time, and who decides?

## What to measure

Check weekly, and write the numbers down; they are the case study's next chapter.

- Daily readers and the share who return (`npm run stats`)
- Email subscribers and open rate (Buttondown dashboard)
- Which stories and opinion columns get read
- Teacher replies, and how many would use it weekly

## Limits to keep in mind

- Netlify free plan: 300 credits a month; each production deploy costs 15, and traffic and the pipeline spend the rest. Batch changes, test on preview deploys (free), and deploy to production rarely.
- Buttondown free plan: 100 subscribers.
- If a post takes off, check the Netlify usage page that day.
