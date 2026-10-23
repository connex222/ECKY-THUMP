# ECKY THUMP — Our Maureen: recording script

**Stage 5 · 60 original lines · all under 12 words · UK English**

Our Maureen is the fictional compère at the ECKY THUMP Social Club. Her display name is defined only in the voice-line manifest (`compereName`) so it can be changed in one place.

## Recording and activation

1. Record the following short lines in your natural voice. A warm, dry Northern delivery is encouraged; the lines work without putting on an accent.
2. Export one mono `.ogg` file per ID, using exactly the filename shown (for example, `maureen-reveal-01.ogg`).
3. Place recordings in `public/assets/audio/maureen/` (create that folder).
4. Set that line's `recorded` value to `true` in **both** `server/packs/voice-lines.json` and `public/assets/voice-lines.json`. They must remain identical (a test checks this).
5. On the TV, select **ENABLE VOICE**. Voice is off unless someone taps the button, even when a recording is present. Captions are always visible.
6. Existing music, effects and voice follow the Social Club TV's master volume. No external audio hosting, API or network voice service is needed.

**Missing file?** The caption remains visible. Playback failure is ignored so the round never stops. For extra safety, lines marked `recorded:false` are never requested.

## Full script

### Lobby

- **`maureen-lobby-01`** — Come in, coats off, and find your daftest mate.
- **`maureen-lobby-02`** — The kettle's on. The judgement's off.
- **`maureen-lobby-03`** — Don't all rush for the meat raffle at once.
- **`maureen-lobby-04`** — Welcome to the club. Mind the step.
- **`maureen-lobby-05`** — We're open. Someone fetch the good biscuits.

### Round Intro

- **`maureen-round-intro-01`** — Right, who's brought a decent answer tonight?
- **`maureen-round-intro-02`** — Here we go. No pressure, just your reputation.
- **`maureen-round-intro-03`** — Eyes front, phones ready, chins up.
- **`maureen-round-intro-04`** — There's a hush. That can't be good.
- **`maureen-round-intro-05`** — Next act, please. Keep it respectable-ish.

### Submit

- **`maureen-submit-01`** — Get writing. The committee's watching.
- **`maureen-submit-02`** — Make it snappy. Our tea's going cold.
- **`maureen-submit-03`** — Big ideas, little screens. Off you go.
- **`maureen-submit-04`** — You can't blame the pen this time.
- **`maureen-submit-05`** — Write something worth telling your nan. Maybe.

### Reveal

- **`maureen-reveal-01`** — Ooh. Someone actually put that in writing.
- **`maureen-reveal-02`** — Well, that's an interesting choice of words.
- **`maureen-reveal-03`** — Brace yourselves. This one's come from a mate.
- **`maureen-reveal-04`** — Let's see what fell out of their head.
- **`maureen-reveal-05`** — Here's the answer. I'll say nowt more.

### Vote

- **`maureen-vote-01`** — A or B? Use your loaf.
- **`maureen-vote-02`** — No peeking. Pick your favourite shocker.
- **`maureen-vote-03`** — The ballot's open. Keep your elbows in.
- **`maureen-vote-04`** — Phones out. We need a verdict.
- **`maureen-vote-05`** — Vote fairly. Maureen knows where you sit.

### Vote Close

- **`maureen-vote-close-01`** — Right. The votes are in. Crikey.
- **`maureen-vote-close-02`** — That's democracy at the Social Club.
- **`maureen-vote-close-03`** — The club has spoken. Loudly, as usual.
- **`maureen-vote-close-04`** — Numbers don't lie. Usually.
- **`maureen-vote-close-05`** — And here's what the room made of that.

### Unanimous Win

- **`maureen-unanimous-win-01`** — ECKY THUMP! That's a proper walloping!
- **`maureen-unanimous-win-02`** — Not one dissenter. Somebody ring the bell!
- **`maureen-unanimous-win-03`** — Well, everyone's agreed. Mark the calendar.
- **`maureen-unanimous-win-04`** — Clean sweep! Get the brass band out!
- **`maureen-unanimous-win-05`** — ECKY THUMP! The room's lost its mind!

### Comeback

- **`maureen-comeback-01`** — Look who's back in the running!
- **`maureen-comeback-02`** — From nowhere! Somebody check that scoreboard.
- **`maureen-comeback-03`** — Ooh, we've got a proper contest now.
- **`maureen-comeback-04`** — They weren't finished. Not by a long chalk.
- **`maureen-comeback-05`** — A turn-up for the raffle books!

### Last Orders

- **`maureen-last-orders-01`** — Last orders! Put your best nonsense forward.
- **`maureen-last-orders-02`** — Final round. Don't spill your nerve.
- **`maureen-last-orders-03`** — Bell's rung. It's the last chance saloon.
- **`maureen-last-orders-04`** — One last answer. Make it worth the bus fare.
- **`maureen-last-orders-05`** — Last orders, folks. This one's worth double.

### Champion

- **`maureen-champion-01`** — Make some noise for tonight's champion!
- **`maureen-champion-02`** — Winner buys the crisps. Club rules.
- **`maureen-champion-03`** — A champion! Someone polish the imaginary trophy.
- **`maureen-champion-04`** — Well played. That's going on the noticeboard.
- **`maureen-champion-05`** — Take a bow. You've earned your black pudding.

### Idle Nudge

- **`maureen-idle-nudge-01`** — There's room for another. Don't be shy.
- **`maureen-idle-nudge-02`** — We're still here. The biscuits aren't.
- **`maureen-idle-nudge-03`** — Waiting for the last straggler, as usual.
- **`maureen-idle-nudge-04`** — Come along. Saturday won't wait forever.
- **`maureen-idle-nudge-05`** — We've saved you a seat by the radiator.

### Awaiting Answers

- **`maureen-awaiting-answers-01`** — Ten seconds! Pens down soon, love.
- **`maureen-awaiting-answers-02`** — Clock's ticking. Don't write a novel.
- **`maureen-awaiting-answers-03`** — Someone's still composing their masterpiece.
- **`maureen-awaiting-answers-04`** — Nearly there. Last chance for a cracker.
- **`maureen-awaiting-answers-05`** — Hurry along. Our Maureen's got plans.

