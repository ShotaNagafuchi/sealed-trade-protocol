# Launch Strategy

Internal notes. Not intended for the public release — keep this on the
`claude/a2a-marketing-strategy-CCihQ` branch or move to a private repo
before merging to `main`.

## Positioning

**Technical positioning (what we tell engineers):**
A confidential negotiation layer for agent-to-agent bilateral trade.
Complements existing A2A (Google → Linux Foundation, 2025) and ACP
(IBM, agent commerce) by sealing the negotiation phase inside TEEs.
Settlement on L2 stablecoin rails. Solves the **information
double-use problem**: the information you share to reach a deal is
reused to worsen its terms.

**Narrative positioning (what we hook with):**
A peer-to-peer protocol with a paper released first, code released
second — the same release pattern as Bitcoin. The thesis is parallel:
*Bitcoin removed the trusted intermediary from payment. Sealed Trade
removes the trusted intermediary from negotiation.* The Bitcoin
analogy is **homage to the release format and the P2P thesis, not
a claim of equivalent significance.** Articulate this explicitly in
the README to inoculate against "next Bitcoin" cringe.

## Anti-patterns (do not do)

- ❌ Title posts "Next Bitcoin" or "Bitcoin for AI" on Hacker News,
  r/ethereum, r/MachineLearning. Instant credibility kill.
- ❌ Claim to have invented A2A. A2A is a Google-originated open
  standard with 150+ supporters as of 2026. We extend / complement it.
- ❌ Hide the fact that the agent runtime is not yet implemented.
  The smart contracts and economic simulation are real; the TEE
  agent runtime is the next milestone. Hiding this gets caught and
  destroys trust.
- ❌ Hide that contracts are unaudited. Lead with it.
- ❌ Cross-post the same text to multiple subs. Each community has
  different norms and will downvote duplicates.
- ❌ Use the project name as the Reddit / HN username.

## Release order (paper-first, Bitcoin-style)

The Bitcoin paper was posted on **2008-10-31 to the Cryptography
Mailing List at `metzdowd.com`** (Perry Metzger's list), followed by
`bitcoin.org`, then `bitcointalk.org` (2009-11), then organically to
Reddit (2010-09). The lesson: paper first, in a serious venue,
*before* social media. Build the artifact people can cite, then
let social media discover it.

**Phase 0 — Pre-launch (do before posting anywhere):**

1. Rewrite README to a two-layer structure (see `README_REWRITE.md` —
   to be written next).
2. Mint a stable paper URL: GitHub Pages or PAPER.md permalink.
   Make sure the PDF metadata is clean (already done in commit
   36bed20).
3. Pick a posting identity that is **not** "sealed-trade" — use a
   personal handle. HN explicitly flags brand-account posting.
4. Make sure CI is green, `forge test` passes, and the demo
   (`Demo.s.sol`) works against a fresh Anvil. People will run it
   within minutes of clicking the HN link.
5. Prepare a `discussions` tab on GitHub for the inevitable
   "what about MPC / FHE / ZKP" thread that will recur on every
   platform.

**Phase 1 — Origin venue (paper, no hype):**

- **arXiv** (cs.CR primary, cs.MA cross-list). This is the modern
  equivalent of the cryptography mailing list. Stable citation,
  searchable, taken seriously by researchers.
- **metzdowd Cryptography Mailing List** — confirm if still active
  in 2026 before posting; if active, post as a deliberate Bitcoin
  homage with a one-line acknowledgment of the format.
- **IACR ePrint** — optional, only if a crypto reviewer would take
  it seriously. Probably overkill for a TEE-based system.

**Phase 2 — Technical communities (no Bitcoin framing):**

In order:

1. **Hacker News (Show HN)** — Tuesday or Wednesday, 08:00–10:00 PT
   for US workday traffic. Title: factual. Body: 80–120 words. Lead
   with the problem. (See `posts/hackernews.md`.)
2. **Lobste.rs** — if invited / have account. Tag `crypto`,
   `distributed`, `ai`.
3. **r/ethereum** — once HN has settled. Frame around the settlement
   layer + bond design.
4. **ethresear.ch** — only post if there is a specific technical
   question or invitation to critique. Don't use it as a megaphone.

**Phase 3 — Adjacent technical communities (AI, TEE):**

5. **r/LocalLLaMA** — "LLM-in-TEE as a negotiator" angle. The sub
   cares about model sovereignty and tooling.
6. **r/AI_Agents** — agent-to-agent commerce angle. The May 2026
   discourse on the sub is about failure modes and security; we fit
   the conversation.
7. **r/MachineLearning** — `[R]` tag, paper-style. Comparison table
   vs. MPC / FHE / ZKP / trusted broker is the hook.
8. **TEE community Discords** — Phala, Marlin, Oasis, Secret. Ask
   for technical critique, not promotion.

**Phase 4 — Narrative communities (Bitcoin homage allowed):**

9. **X / Twitter thread** — Bitcoin homage hook works here. Crypto
   Twitter and AI-agent Twitter overlap meaningfully in 2026.
   Thread structure in `posts/x-thread.md`.
10. **r/CryptoCurrency** — narrative-friendly. Frame as
    "Satoshi-era release pattern for the agent economy."
11. **Farcaster / Lens** — repost the X thread.
12. **Mirror / Paragraph** — longform essay version of the X thread.

**Phase 5 — Mass reach (only if Phases 1–3 land):**

13. **Product Hunt** — OSS infrastructure category.
14. **Newsletters**: Latent Space, Last Week in AI, Bankless, Week
    in Ethereum News. Pitch with the paper, not the GitHub link.

## Timing notes

- Don't post Friday afternoons or weekends (HN, Reddit traffic dies).
- Avoid posting during major conferences (Devcon, NeurIPS, ETHCC)
  unless you're at the conference and can tie it in.
- If a post fails to gain traction, do NOT repost. Wait 4–8 weeks,
  rewrite the angle, then try again with a different lead.

## Success criteria

- HN: front page (top 30) for >2h. ~150+ points is meaningful.
- r/ethereum: top 5 of /new for the day; 50+ upvotes.
- r/LocalLLaMA: 100+ upvotes, comments engaging with the TEE
  trust model.
- X thread: 50+ qRTs from known agent / crypto / TEE accounts.

What we want from the launch is **reviewers and contributors**, not
users. The agent runtime is unbuilt. The audit is unbought. The
goal of the launch is to recruit the people who will help with both.
