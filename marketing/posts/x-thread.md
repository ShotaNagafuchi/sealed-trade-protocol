# X / Twitter Thread

**Audience.** Crypto Twitter + AI-agent Twitter overlap (large in
2026). Receptive to narrative framing. Standalone tweets matter —
threads get quoted in fragments, so each tweet has to make sense
alone.

**Bitcoin framing.** Allowed, but every Bitcoin reference is
paired with disambiguation in the same or next tweet.

**Length.** 9 tweets. Each ≤ 280 chars including link / handle if
any.

**Timing.** Tuesday or Wednesday, 09:00 ET / 14:00 UTC. Both
crypto and AI-agent Twitter awake.

---

## Lead variants

Two openers. Pick by date.

**Default (any day).** Tweet 1:

> A small thing, paper-first, in the tradition.
>
> A protocol that tries to remove the trusted intermediary from
> peer-to-peer **negotiation** — the same shape of claim Bitcoin
> made for payment, one layer up, much smaller.
>
> Not a comparable claim. The homage is the format.

(279 chars.)

**Anniversary lead (post Oct 31 ±2 days).** Tweet 1:

> 18 years ago this week, a paper was posted to a cryptography
> mailing list claiming you could remove the trusted intermediary
> from peer-to-peer payment.
>
> Today, a similarly small thing — a paper that tries to do the
> same one layer up: negotiation.

(278 chars.)

---

## Main thread (Tweets 2–9)

**2/**

> The setup is the same.
>
> Paper first. Code attached, but unaudited and explicitly not for
> mainnet. No token, no airdrop, no points, no chain.
> Apache-2.0. Solo dev.
>
> This is not a Bitcoin-comparable claim. The homage is the
> *release format*, not the magnitude.

(266 chars.)

**3/ — the problem**

> In every bilateral trade — IP licensing, M&A, a private real
> estate deal — you have to communicate enough of your private
> valuation to reach an agreement.
>
> The same communication is what the counterparty uses to take
> surplus from you.

(247 chars.)

**4/ — the mechanism of the tax**

> Every first offer reveals an upper bound.
> Every concession reveals urgency.
> Every silence reveals patience.
>
> The information you share to reach a deal is reused to worsen
> its terms. I call this **information double-use**.

(232 chars.)

**5/ — why agents make it worse, not better**

> When the negotiators are LLM agents this gets *worse*, not
> better.
>
> A cooperatively post-trained LLM will surface intermediate
> reasoning a strategic human would suppress. It will say the
> quiet part out loud — to the other side's agent.

(244 chars.)

**6/ — the move**

> Put both agents into the same hardware-isolated enclave (Intel
> TDX, AMD SEV-SNP).
>
> Each is bound by signed parameters from its principal — an
> envelope it cannot commit outside of.
>
> A2A negotiation runs inside. Only the outcome leaves. Memory
> destroyed.

(265 chars.)

**7/ — what nobody gets afterward**

> Neither party can observe the negotiation.
> Neither party can subpoena the transcript.
> The intermediate offers, hesitations, concession patterns —
> the stuff experienced negotiators exploit —
> never become information either side controls.

(264 chars.)

**8/ — why not the obvious alternatives**

> Why not MPC? Can't host an open-ended LLM negotiation as a
> circuit.
> Why not FHE? Orders of magnitude too slow for LLM inference.
> Why not ZKP? Proves correctness, can't seal arbitrary content.
> Why not a trusted broker? The broker becomes the leak.

(266 chars.)

**9/ — the honest trade**

> TEE isn't trustless. We swap mathematical hardness for hardware-
> vendor + supply-chain trust. Foreshadow, ÆPIC, CacheOut are in
> the paper's limitations section.
>
> An insurance pool bounds the *economic* consequence of breach.
> Not the same as preventing it.

(271 chars.)

---

## Closer (Tweets 10–11)

Two variants for the closer. Pick one.

**Closer A — review-seeking (preferred for the launch):**

> What is in the repo right now: settlement contracts (51 tests,
> Anvil demo), the paper EN+JA, the economic model.
>
> The TEE agent runtime is in active development, not in this
> commit. We wanted the design reviewed before building against
> an unreviewed spec.

(263 chars.)

> If you build agents that negotiate, I want to hear how they
> fail.
> If you work on TEE, tell me what the paper gets wrong about
> attestation.
>
> No followers needed, no airdrop coming. Just feedback.
>
> Paper: [link]
> Code: [github link]

(241 chars.)

**Closer B — short version (use if cutting the thread to 9 tweets total):**

> What's in the repo: settlement contracts (51 tests, Anvil demo),
> paper EN+JA, economic model. TEE agent runtime in active
> development.
>
> Paper: [link]
> Code: [github]
>
> Reviewers and contributors welcome. No token. No followers
> needed. Just feedback.

(263 chars.)

---

## Posting mechanics

- Each tweet stands alone — they will be quoted out of context.
- Don't include the GitHub link until tweet 10/11. The link sucks
  algorithmic reach out of the lead.
- Reply to your own thread with the link in tweet 11 instead of
  putting it inline.
- Quote the lead tweet ~6 hours later with one new line of
  framing (a "by the way" tweet) to surface it to a second
  timezone. Don't reply to the lead — quote it.
- Do not engage with engagement-farm replies ("wen token"). Mute
  them.
- If a known TEE / agent / crypto account engages substantively,
  reply within 30 minutes for the first 4 hours.

## Quote-tweet seed (for sharing the thread later)

After the thread lands, write a separate single tweet that can be
quote-tweeted by friends without amplifying the "Bitcoin homage"
frame to skeptical audiences:

> Open-source A2A negotiation protocol with on-chain bonded
> settlement. Confines LLM-to-LLM negotiation to a hardware
> enclave so neither party can reconstruct the other's reservation
> price from the transcript.
>
> Paper, code, no token.
> [link]

(278 chars.) This is the "no Bitcoin reference" version that
researchers can RT without endorsing the narrative angle.

---

## Things to avoid

- ❌ Bitcoin price chart or any chart at all
- ❌ "Next Bitcoin" as a phrase, ever, even ironically — it will
  be screenshotted without the disambiguation tweet
- ❌ Quote-tweeting price commentary
- ❌ Engaging with "wen token" / "wen mainnet" replies
- ❌ Posting during obvious news / market events that will eat the
  algorithm budget
