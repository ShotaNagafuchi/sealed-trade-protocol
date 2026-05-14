# r/AI_Agents

**Sub norms (May 2026):** practical-builder leaning. Recent
discourse: failure modes, cost per task, reliability, what happens
when agents touch real systems. Engages with concrete use cases.
Lower tolerance for paper-only posts than r/MachineLearning.

**Bitcoin framing:** absent. Bitcoin homage works on r/CryptoCurrency
and X. Not here.

---

## Title

```
Has anyone shipped an agent that negotiates on a principal's behalf without
leaking the principal's terms? Sharing a protocol attempt + asking for failure
modes you've seen
```

Alternate (less question-shaped):

```
A2A negotiation that doesn't leak your principal's reservation price —
TEE-confined agent pair, paper + reference settlement layer
```

The question-shaped title fits this sub better. It invites
discussion. Naked launch titles get less traction here.

---

## Body

> The thing I keep getting stuck on with agent commerce: the
> moment an agent negotiates on your behalf, every message it
> sends is a signal the counterparty can exploit. "Sure, $50k works
> for us" — the counterparty now knows you would have accepted
> $50k. They will not offer $45k next time. The agent didn't leak
> a secret; it leaked the *shape of your indifference curve*,
> which is worse.
>
> Have any of you actually shipped an agent into a real-money
> negotiation flow? What did you do about this? The obvious moves:
>
> 1. **Prompt the agent to be cagey.** Doesn't work. Cooperative
>    fine-tuning is too strong. The agent reverts to helpful.
> 2. **Run the agent server-side and proxy the messages.** Now your
>    server sees both sides of every deal and you've reinvented the
>    trusted-broker problem.
> 3. **Use structured output only — no free-form messages.**
>    Reduces leakage in form but not in content. "I propose $52k"
>    is just as revealing as "we could do $52k."
> 4. **Don't have agents negotiate; have them just transact at
>    listed prices.** Works for SaaS-style commerce. Doesn't work
>    for IP licensing, M&A, real estate, custom services.
>
> I've been writing up a protocol attempt that takes a different
> route: put both agents into the same hardware enclave (TDX or
> SEV-SNP), bind each one to a signed parameter envelope from its
> principal, run the A2A negotiation entirely inside the enclave,
> publish only the final outcome, then destroy the enclave memory.
>
> The result is that the counterparty's *server / principal /
> infrastructure* never sees the negotiation. They get the same
> commitment the seller's principal does: agreement or no-deal.
> They can't go back and reconstruct your reservation price from
> the transcript because there's no transcript anyone can read.
>
> What's actually built:
>
> - Settlement layer (bonded escrow, 3-stage commitment, on-chain
>   audit trail). Solidity, 51 tests.
> - Paper covering the design.
> - Economic simulation.
>
> What's not built:
>
> - The TEE agent runtime itself. Honest about this. The settlement
>   layer was first so the runtime has a substrate to plug into.
>
> Open source, Apache-2.0. [github] · [paper]
>
> **Real ask for this sub:** if you've shipped an agent into a
> negotiation context, where did it leak? What was the failure
> mode? Did you mitigate it, and how? I'm trying to make sure the
> protocol addresses the failures that actually happen, not the
> failures that sound clever in a paper.

---

## Why this framing works on r/AI_Agents

- Opens with a problem the sub is actively chewing on
- Treats the audience as peers who have shipped agents
- Asks a real question, doesn't just announce a project
- Concrete failure-mode taxonomy at the top
- Project link comes after the value, not before

## Things to avoid

- ❌ Leading with the project name
- ❌ "Building the future of agent commerce"
- ❌ Bitcoin / crypto narrative
- ❌ Excessive technical depth on the TEE side (link to paper)
