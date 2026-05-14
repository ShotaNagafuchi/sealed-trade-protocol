# Hacker News — Show HN

**Timing:** Tuesday or Wednesday, 08:00–10:00 PT.
**Account:** personal handle, not a brand account.
**Bitcoin framing:** none. HN is allergic.

---

## Title (80 chars max)

Primary candidate:

```
Show HN: Sealed Trade – TEE-confined AI agents negotiate without leaking terms
```

Alternates:

```
Show HN: Bilateral trade protocol where agents negotiate inside hardware enclaves
Show HN: Confidential negotiation layer for A2A (paper + Solidity + Anvil demo)
```

Pick the primary. It states what it is in 12 words.

---

## Body (first comment by OP, 100–140 words)

> In private bilateral markets — IP licensing, M&A, real estate —
> negotiating itself leaks information. Every offer signals a
> boundary the counterparty exploits. We call this *information
> double-use*: the information shared to reach a deal is reused to
> worsen its terms.
>
> Sealed Trade confines negotiation to AI agents running inside
> hardware enclaves (TDX / SEV-SNP). Each agent is bound by signed
> parameters from its principal. Neither party can observe the
> negotiation; only the outcome — agreement or no deal — exits the
> enclave. Settlement is on L2 stablecoin rails via bonded escrow.
>
> What's actually in the repo right now: settlement contracts
> (51 tests passing), economic simulation, paper, end-to-end demo
> on local Anvil. The TEE agent runtime is the next milestone and
> not yet implemented — flagged in the README and the paper's
> limitations section.
>
> Contracts are not audited. Don't deploy with real funds.
>
> Paper, code, and the comparison vs. MPC / FHE / ZKP / trusted
> broker are in the README. Critique welcome, especially on the
> trust-the-hardware-vendor tradeoff.

---

## Anticipated comment threads & pre-prepared answers

**"Why not MPC / FHE / ZKP?"**

> Short version, longer in the paper: MPC needs predefined
> circuits and can't host an open-ended LLM negotiation. FHE is
> orders of magnitude too slow for LLM inference. ZKP proves
> correctness but doesn't seal arbitrary content. The honest
> framing is that all four approaches have different trust roots
> and different performance profiles; TEE is the only one that
> currently runs an LLM at interactive latency.

**"TEE has been broken before. Foreshadow, ÆPIC, etc."**

> Acknowledged in §5.1 of the paper. Hardware trust is a different
> class of assumption than mathematical hardness, with a worse
> track record on confidentiality. The protocol bounds the economic
> consequence via an insurance pool funded by fees and slashed
> bonds. That's a partial answer, not a complete one.

**"Why crypto at all? Why not a regular escrow service?"**

> Agent-to-agent settlement needs a programmable, permissionless
> rail. Bank transfers need human approval and take hours.
> Stablecoin on L2 gives sub-second finality and atomic settlement
> (deal value + bond release in one tx). Smart contracts replace
> the trusted escrow agent.

**"Is this just a Bitcoin clone / 'next Bitcoin' play?"**

> No. It's not a payment system, not a chain, not a token. The
> paper is structured as a P2P protocol paper because the problem
> is structurally analogous — removing a trusted intermediary from
> bilateral interaction. The README is explicit about this being a
> format homage, not a comparable claim.

**"The agent runtime isn't built — so this is vaporware?"**

> The settlement layer is real, tested, and demonstrable on
> Anvil today. The TEE agent runtime is explicitly the next
> milestone. Fair criticism. The release is paper + settlement
> infrastructure — the substrate the runtime will plug into. We
> wanted the design reviewed before building the harder part.

**"Who's the team? Funded by?"**

> Solo dev. Unfunded. Apache-2.0. Looking for technical reviewers
> and contributors, not customers.

---

## What NOT to write in the post

- ❌ "Revolutionary"
- ❌ "First-ever"
- ❌ "We're building the future of X"
- ❌ Any reference to Bitcoin as a comparison
- ❌ Any reference to AI hype cycles or "agentic economy"
- ❌ Founder-as-username
- ❌ Excessive emoji or formatting

---

## After posting

- Reply to every substantive comment within 30 minutes for the
  first 4 hours. HN ranking weights early engagement.
- If the post stalls (<10 points in 2h), do nothing. Reposts get
  shadow-killed.
- If it lands (top 30), expect the GitHub repo to take 1–2k
  visits. Make sure CI is green and `forge test` works from a
  clean clone.
