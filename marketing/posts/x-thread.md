# X / Twitter Thread

**Audience:** crypto Twitter + AI agent Twitter overlap (large in
2026). Receptive to narrative framing. Threads with a clear story
arc outperform link-dumps.

**Bitcoin framing:** allowed and effective. Lean in but keep the
disambiguation visible.

**Length:** 10–12 tweets. Each one stands alone (assume thread is
quoted in fragments).

**Timing:** Tuesday or Wednesday, 09:00 ET / 14:00 UTC. Crypto and
AI Twitter both awake.

---

## Thread

**1/**

> 17 years ago today (or close enough), a paper was posted to a
> cryptography mailing list claiming you could remove the trusted
> intermediary from peer-to-peer payment.
>
> Today I'm posting something similar in shape — a paper that tries
> to remove the trusted intermediary from peer-to-peer **negotiation**.

*(If today isn't on or near Oct 31, drop the "17 years ago today"
opener and rewrite to "In 2008, Satoshi posted a paper…")*

**2/**

> The setup is the same.
>
> Paper first. Code attached, but unaudited and explicitly not for
> mainnet. No token, no airdrop, no points, no chain. Apache-2.0.
> Solo dev.
>
> This is not a comparable claim to Bitcoin. The homage is the
> *release format* and the *thesis shape*, not the magnitude.

**3/**

> The problem.
>
> In every bilateral trade — an IP license, an M&A, a private
> real estate deal — you have to communicate enough of your
> private valuation to reach an agreement.
>
> The same communication is what the counterparty uses to take
> surplus from you.

**4/**

> Every first offer reveals an upper bound.
> Every concession reveals urgency.
> Every silence reveals patience.
>
> The information you share to reach a deal is reused to worsen
> its terms.
>
> I call this **information double-use**. It is the fundamental
> tax on private bilateral trade.

**5/**

> When the negotiators are LLM agents, this gets *worse*, not
> better.
>
> A cooperatively-tuned LLM will surface intermediate reasoning
> that a strategic human negotiator would suppress. It will say
> the quiet part out loud. To the *other side's* agent.

**6/**

> The protocol: put both agents inside the same hardware-isolated
> enclave (Intel TDX, AMD SEV-SNP).
>
> Each agent is bound by signed parameters from its principal —
> an envelope it cannot commit outside of.
>
> Negotiation happens A2A. Only the outcome leaves.

**7/**

> Neither party can observe the negotiation.
> Neither party can subpoena the transcript later.
> The intermediate offers, hesitations, concessions —
> the stuff experienced negotiators exploit —
> never become information either side controls.
>
> Memory is destroyed when the enclave terminates.

**8/**

> Why not MPC? Can't host an open-ended LLM negotiation as a
> circuit.
> Why not FHE? Orders of magnitude too slow for LLM inference.
> Why not ZKP? Proves correctness, can't seal arbitrary content.
> Why not a trusted broker? The broker is now the leak.
>
> TEE is the only path with current hardware.

**9/**

> TEE is not trustless. We swap mathematical hardness for
> hardware-vendor trust + supply-chain assumptions. Foreshadow,
> ÆPIC, CacheOut are all in the paper's limitations section.
>
> The protocol bounds the economic consequence with an insurance
> pool funded by fees and slashed bonds. Not the same as
> preventing breach.

**10/**

> What's actually built right now:
>
> – Solidity settlement layer. 51 tests passing.
> – Economic simulation in Python.
> – Demo: full trade lifecycle on local Anvil.
> – Paper, EN + JA.
>
> What's NOT built:
>
> – The TEE-confined agent runtime. Next milestone. Honestly the
>   harder half.

**11/**

> Why publish before the runtime is built?
>
> Because the design is the part that benefits from being reviewed
> early. The substrate exists. The substrate should be torn apart
> by smart people before the runtime is built against it.
>
> Paper first. Code soon. Mainnet only after an audit, period.

**12/**

> Paper: [link]
> Code: [github link]
>
> If you build agents that negotiate, I want to hear how they fail.
> If you work on TEE, I want to hear what the paper gets wrong
> about attestation.
>
> No followers needed, no airdrop coming. Just feedback.

---

## Variants per platform

**Farcaster:** post the same thread. Replace the Oct 31 opener
with "A small thing, paper-first, in the tradition" if not on/near
that date.

**Lens:** same.

**Substack / Mirror essay:** expand the thread to ~1500 words with
the same arc. Add the comparison table from the paper. Add the
"things this protocol does NOT do" section verbatim.

## Things to avoid

- ❌ "Next Bitcoin" as a phrase without immediate disambiguation
- ❌ Replying to engagement-farming "wen token" replies
- ❌ Quote-tweeting people who frame this as a price-relevant event
- ❌ Posting price-related charts of any asset
