# r/CryptoCurrency

**Sub norms:** huge (millions), narrative-friendly, hype-tolerant
but allergic to obvious scams. Bitcoin homage is *expected* in
context, not a red flag. Will react badly to: unaudited mainnet
deployments, token launches without utility, "next Bitcoin"
without substance.

**Bitcoin framing:** allowed and effective if used with self-awareness.

**Timing:** US evening / global afternoon. Avoid weekends.

---

## Title

The honest narrative title:

```
Sealed Trade Protocol: a paper-first release in the Satoshi tradition — sealing
the negotiation layer of the agent economy
```

Alternate (more conservative):

```
Open-source A2A negotiation protocol with on-chain settlement — paper, code,
no token, in the paper-first release tradition
```

Prefer the first if comfortable with the Bitcoin homage being
explicit; the second if you want to keep it deniable.

---

## Body

> On 2008-10-31, Satoshi Nakamoto posted a paper to a cryptography
> mailing list before there was any code anyone could run. The
> paper claimed something specific: that you could remove the
> trusted intermediary from peer-to-peer payment. The code came
> later. The community came later. The price came much later.
>
> This is a similarly small thing posted in a similarly small way.
> Not a comparable claim — please read the next paragraph before
> jumping to conclusions.
>
> **What this is:** a protocol for bilateral trade — IP licensing,
> M&A, real estate — where the negotiation happens between AI
> agents inside a hardware enclave (TEE), and neither party can
> observe what the other agent said, conceded to, or held out for.
> Only the outcome — agreement or no-deal — leaves the enclave.
> Settlement is on-chain via bonded escrow on L2 stablecoin rails.
> The thesis is parallel to Bitcoin's, scoped one layer up:
> *Bitcoin removed the trusted intermediary from payment. This
> removes the trusted intermediary from negotiation.*
>
> **What this is NOT:**
>
> - Not a token. No token. No airdrop. No points.
> - Not a chain. Runs on any EVM L2.
> - Not a DEX. Not a market-maker. Not yield.
> - Not "the next Bitcoin." It is a P2P paper with code attached.
>   The homage is the release format, not the claim.
> - Not audited. **Do not deploy with real funds.** The README
>   says this in bold. Do not be the person who ignores it.
>
> **The problem in one paragraph.** In every bilateral trade,
> private valuations have to be partially communicated to reach
> a deal — and the same communication is what the counterparty
> uses to extract surplus from you. Your first offer reveals your
> upper bound. Your concession speed reveals your urgency. This is
> the **information double-use problem**: the information you
> share to reach a deal is reused to worsen its terms. The protocol
> seals the negotiation channel so this leakage stops.
>
> **What's actually in the repo right now:**
>
> - Paper (English + Japanese).
> - Solidity settlement contracts (51 tests passing).
> - Economic simulation in Python.
> - End-to-end demo on local Anvil.
> - The agent runtime — the TEE-confined negotiator — is the next
>   milestone and explicitly not built yet.
>
> Apache-2.0. Solo dev. Unfunded. Looking for technical reviewers
> and contributors.
>
> [paper] · [github]
>
> Feedback welcome. The "this is just a Bitcoin clone" objection is
> answered in the README. The "TEE isn't trustless" objection is
> answered in the paper.

---

## Anticipated comments

**"Where's the token?"**

> No token. Fees fund an insurance pool. That's the whole
> tokenomics.

**"So this is just a hosted service with extra steps?"**

> The settlement layer is permissionless and on-chain. The agent
> runtime is intended to be run by anyone with TEE hardware. Hosted
> vs. self-hosted is a deployment choice, not a protocol property.

**"Smart contracts unaudited, why post this?"**

> Because the paper and the design are reviewable now. The audit
> is a milestone, not a precondition for sharing the design.
> Mainnet deployment with funds *is* gated on audit, explicitly.

**"You're not Satoshi."**

> Correct. The post says that explicitly. The release format is
> the homage. The claim is one layer up and much smaller.

---

## Things to lean into

- ✅ Tokenless framing (anti-scam signal)
- ✅ Honest "not audited, do not deploy" warning
- ✅ Paper-first release pattern
- ✅ Specific, narrow technical claim (not "revolutionizing X")

## Things to avoid

- ❌ Any roadmap with dates
- ❌ Price talk
- ❌ Any phrase that could be screenshotted as "next Bitcoin"
  without context — every Bitcoin reference must be paired with
  explicit "this is not a comparable claim" disambiguation
- ❌ Engagement with replies that try to bait a token announcement
