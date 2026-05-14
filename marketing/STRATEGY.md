# Launch Strategy

Internal notes. Not intended for the public release — keep this on
the `claude/a2a-marketing-strategy-CCihQ` branch or move to a
private repo before merging to `main`.

## Positioning (single source of truth)

**Technical positioning (engineers, researchers, builders).**
A confidential negotiation layer for agent-to-agent bilateral trade.
Complements existing A2A (Google → Linux Foundation, 2025) and ACP
(IBM, agent commerce) by sealing the negotiation phase inside TEEs.
Settlement on L2 stablecoin rails. Solves the **information
double-use problem**: the information you share to reach a deal is
reused to worsen its terms.

**Narrative positioning (broader audience).**
A peer-to-peer protocol released paper-first, code-second — the
same release pattern as Bitcoin. Thesis is parallel, scoped one
layer up: *Bitcoin removed the trusted intermediary from payment.
Sealed Trade removes the trusted intermediary from negotiation.*
The Bitcoin reference is **homage to the release format and the
P2P thesis shape, not a claim of comparable magnitude.** Every
draft includes explicit disambiguation in the same paragraph.

**Repo state, said the same way everywhere.**
Settlement layer is built and tested: 51 unit tests, Anvil demo,
economic simulation, paper EN+JA. TEE agent runtime is in active
development, not in the current public commit. Contracts are not
audited; the README says so. Be consistent across platforms — a
contradiction across two posts costs more than the worst single
post.

## Two channels, not fourteen

Earlier draft had 14 platforms across 5 phases. Replaced with two
channels distinguished by *what they're for*, not by URL.

```
┌────────────────────────────────────┐  ┌─────────────────────────────────────┐
│ ONLINE                             │  │ IN-PERSON                           │
│ — broadcast layer                  │  │ — relational layer                  │
│ — reach: thousands of strangers    │  │ — reach: dozens of named people     │
│ — goal: discovery & critique       │  │ — goal: trust & specific asks       │
│ — currency: prose quality          │  │ — currency: meeting-count           │
└────────────────────────────────────┘  └─────────────────────────────────────┘
```

The two channels reinforce each other but have completely different
operating rules. Don't mix them — DMing strangers a launch link
loses on both axes.

## ONLINE channel

**Goal.** Get the paper read, the code looked at, and the protocol
torn apart by people who don't know us. Recruit reviewers.

**Order (and only this order):**

1. **Paper venue.** arXiv `cs.CR` primary, `cs.MA` cross-list.
   Stable citation, searchable. This is the modern equivalent of
   the cryptography mailing list Satoshi used in 2008.
2. **Hacker News (Show HN).** Tue/Wed, 08:00–10:00 PT. No Bitcoin
   framing. (Draft: `posts/hackernews.md`.)
3. **r/MachineLearning** (`[R]` flair). Paper-style post.
   (Draft: `posts/reddit-machinelearning.md`.)
4. **r/ethereum.** Settlement-layer + bond-design angle.
   (Draft: `posts/reddit-ethereum.md`.)
5. **r/LocalLLaMA.** LLM-in-TEE / open-weights angle.
   (Draft: `posts/reddit-localllama.md`.)
6. **r/AI_Agents.** Question-shaped post, peer framing.
   (Draft: `posts/reddit-ai-agents.md`.)
7. **r/CryptoCurrency.** Bitcoin homage allowed with explicit
   disambiguation. (Draft: `posts/reddit-cryptocurrency.md`.)
8. **X / Twitter thread.** Bitcoin homage allowed.
   (Draft: `posts/x-thread.md`.)
9. **Farcaster / Lens.** Same thread, slightly rephrased opener.
10. **Mirror / Substack / Paragraph.** Longform essay version of
    the X thread for people who don't read X.

**Pacing.** Don't post all of these in one week. Cluster:

- **Week 1:** arXiv + HN (Tue) + r/MachineLearning (Wed).
- **Week 2:** r/ethereum + r/LocalLLaMA + r/AI_Agents on
  different days.
- **Week 3:** X thread + r/CryptoCurrency + longform essay on the
  same day (cross-link from one to the other).
- **Week 4+:** Farcaster / Lens / newsletter pitches if Weeks 1–3
  landed; if they didn't, stop and reassess before continuing.

**Hard rules for the online channel.**

- ❌ Same body of text across two subs. Each post is rewritten
  for its sub's norms.
- ❌ "Next Bitcoin" without disambiguation in the same paragraph.
- ❌ Brand-name handle (don't post as `@sealedtrade`; post as a
  person).
- ❌ Cross-posting URLs without rewriting the framing for the new
  audience.
- ❌ Reposting a failed post. If a post stalled (<10 points / 2h
  on HN, low engagement on Reddit), do not retry within 4 weeks.
  Reassess angle before retrying.
- ✅ Lead with what is *actually built* on each platform: 51
  tests, Anvil demo, paper, economic sim. Runtime status is a
  footnote, not the headline.

## IN-PERSON channel

**Goal.** Recruit specific named people for review, contribution,
introduction, and (eventually) audit and testnet partnership. The
ask grows with the relationship.

**Tier by meeting count.** This is the simplification — instead
of "is this a friend? acquaintance? cold contact?" use a single
counter: **how many times have we met face-to-face?**

| Tier | Meetings | What they get                    | What we can ask                                   |
|------|---------:|----------------------------------|---------------------------------------------------|
| T0   |        0 | Broadcast only (online channel)  | Nothing direct. Only what reaches them organically. |
| T1   |        1 | DM with paper link, brief context| Read it sometime. No deadline, no follow-up.       |
| T2   |     2–4 | DM with paper + specific ask     | "What's wrong with §X?" / "Who else should see this?" / "Can you read for 30 min?" |
| T3   |       5+ | DM with paper + harder ask       | Review, intro to specific person, blurb, amplification, partnership talk |
| T4   | "we work together / hung out repeatedly" | First-name ask | Audit referral, testnet design partner, coauthor talk |

The threshold isn't 友達 vs 知り合い vs 他人 — those are fuzzy and
let you flatter yourself into asking too much of T1s. Meeting count
is countable and unflattering, which is the point.

**Rules.**

- Never escalate the ask above the tier. T2 gets a T2 ask, even
  if you really like them.
- One meeting per ask in the queue. Don't stack three asks on the
  same T2 contact in two weeks.
- Don't DM the launch link without context. Always: 1 sentence
  reminder of who you are + 1 sentence why you thought of them
  specifically + the link.
- After the ask is fulfilled (or declined), the meeting counter
  doesn't reset, but the ask budget for that quarter does. Don't
  re-ask the same person within a quarter.

**Events worth attending (where T0 → T1 conversions happen).**

Roughly in priority order for this project in 2026:

- **Devcon / ETHCC / ETHGlobal events.** Settlement-layer
  reviewers and L2 contacts. ETHCC (Cannes, July) is the
  highest-density event for the Ethereum infrastructure crowd.
- **Confidential Computing Summit / CC Consortium events.** The
  TEE crowd we need for the runtime review. Smaller, denser,
  higher signal per conversation than crypto events.
- **AI Engineer Summit / NeurIPS / ICLR.** Agent-builder side.
  NeurIPS is overcrowded; AI Engineer Summit is more
  practitioner-leaning and a better fit for the protocol pitch.
- **Token2049 / Consensus.** Lower technical density, higher
  narrative density. Only worth it if there's a specific T2+
  contact who'll be there.
- **Japan-specific (since the lead is in Japan):** ETH Tokyo,
  IVS Crypto, Japan Blockchain Week, plus the smaller TEE / AI
  agent meetups in Tokyo. Lower travel cost, easier to convert
  T0 → T1.

**The actual ask sequence.** What we want from in-person, in
order of escalation:

1. **Read the paper for 30 min and tell me what's wrong.** T2+.
2. **Run the demo and tell me what's confusing.** T2+.
3. **Introduce me to a specific person** (TEE auditor, A2A
   working group, ACP folks at IBM, confidential-computing
   research lead). T3+.
4. **Audit referral or testnet partnership.** T4 only.
5. **Co-author the v2 paper / runtime spec.** T4, and only if
   they've already done #1–#3.

## Cross-channel rules

- The online channel feeds the in-person channel. Conferences
  are where T0 conversations start; the paper / repo / posts are
  what they read after the conversation.
- The in-person channel does not feed the online channel
  publicly. Don't tweet "@friend liked the paper." It evaporates
  the relationship currency.
- One contradiction across the two channels is worse than one
  bad post. If the X thread says "runtime in active development"
  and the HN post says "next milestone," fix one of them before
  posting.

## Success criteria (rewritten)

**Online (broadcast).** What we want is *artifact uptake*:
- arXiv: cited by a serious paper within 12 months.
- HN: front page (top 30) for >2h. ~150+ points meaningful.
- r/MachineLearning: 100+ upvotes, comments engaging with the
  Layer 1/2/3 decomposition.
- X thread: 50+ qRTs from named TEE / agent / crypto accounts
  (not generic crypto influencers).

**In-person (relational).** What we want is *named-person
commitments*:
- ≥3 T3+ contacts who have read the paper and given written
  critique within 60 days of launch.
- ≥1 T4 contact willing to make an audit-firm referral.
- ≥1 T3+ contact at a relevant org (IBM ACP, A2A working group,
  Phala / Marlin / Oasis, NVIDIA CC, etc.) willing to introduce
  to their team.

What we explicitly do **not** want yet: users, integrators,
mainnet partners, press coverage. Those come after the agent
runtime is in the repo and the contracts are audited. Asking for
them now would burn the relationship currency before there's
anything to integrate against.

## Open questions to resolve before any posting

1. Stable URL for the paper. PAPER.md on GitHub works for now;
   arXiv DOI works better long-term.
2. Posting identity (which handle to use on HN, Reddit, X). Must
   not be the project name.
3. Whether to soft-launch to T3+ contacts a week before the
   broadcast posts ("heads up, posting this Tuesday — anything
   wildly wrong?"). Pro: catches obvious mistakes. Con: relationship
   tax. Lean yes, but small list (≤5 names).
