# Matt Hauer Drinks Cheat Sheet — Tue Mar 17, Wanda's Tavern

*Head of Agent Development, FSU demographer, Cozzarelli Prize. Let him talk 60%. Buy him a drink.*

---

## Strategy: Ask About HIS Problems

Matt's likely daily reality right now: making synthetic agents that are believable, consistent, and useful at scale. Every question below is designed to learn what YOU need while being genuinely interesting to HIM.

---

## 🔥 Agent Consistency & Believability (His Core Problem)

**"How do you know when an agent is lying to you?"**
→ He's battling logical consistency (the "embers"). This lets him talk about his hardest current problem. Listen for: what breaks, what the failure modes look like, whether it's prompt engineering or architectural.

**"When you generate a second-gen trait profile, what's the validation step? Like, how do you catch a gun-owning vegan environmentalist in rural Alabama?"**
→ Gets at second-gen tenement traits AND the validation pipeline. He'll appreciate that you understand the combinatorial explosion problem.

**"Is consistency a property of the agent, or a property of the prompt? Like, if you re-instantiate the same agent, does it give the same answers?"**
→ This is a deep question about stochasticity vs. determinism in agent-based LLM systems. Directly relevant to his day-to-day.

---

## 📊 Population Architecture (Where His Demography Meets Aaru)

**"How much of the population generation is top-down demographic allocation vs. bottom-up emergent clustering?"**
→ As a demographer, he thinks in population distributions. This lets him bridge his academic expertise with Aaru's approach. You learn the architecture.

**"Do you ever start with census microdata and then 'uplift' it into agents, or is it fully synthetic from scratch?"**
→ Gets at the data pipeline. Relevant to your PRISM work (you used real survey data as priors). Also reveals how much classical stats vs. LLM is in the mix.

**"What happens when a client's target population doesn't match any well-studied demographic? Like, 'give me 10,000 Gen Z crypto investors in the Midwest' — where do the priors come from?"**
→ Edge cases reveal architecture. This is exactly the kind of problem he's probably solving weekly.

---

## 🎯 The Mean/Median/Mode Question (NEW)

**"When you run a simulation for a client — say, predicting how an audience will respond to a campaign — what are you optimizing for? The mean outcome, the median, or the mode?"**

*Why this matters:* Different loss functions imply different risk postures. Insurance thinks in CVaR (tail risk). Polling thinks in mode (most likely outcome). Marketing thinks in mean (expected value). Aaru serves all of these.

*Follow-ups:*
- "Does it change by product? Polls = modal prediction, Lumen = expected value?"
- "Do clients even know the difference? Is there an education problem?"
- "Do you ever show them the full distribution, or just the point estimate?"

---

## 🛠️ Work Trial Intel (Weave In Naturally)

**"What does a typical first week look like for a new engineer?"**
→ Setup, tooling, onboarding. Listen for: IDE (Cursor?), git workflow, Python env, how long until first PR.

**"What would make someone crush a work trial vs. just pass?"**
→ Direct. He'll respect the directness. Listen for the delta between "competent" and "must-hire."

**"Where is work piling up that nobody has bandwidth for?"**
→ Find the gap you can fill. This is the most valuable question on the list.

**"Can I read the manuscript before I start?"**
→ He offered during the standup visit. Follow through. Reading it = showing you're serious.

---

## 🧪 Technical Depth (If He's in the Mood)

**"How does the classical ML layer interact with the LLM layer? John described 3 stages — where does the handoff break?"**
→ Architecture question that shows you've been paying attention.

**"Is anyone working on longitudinal sims — rolling the same population forward in time — or is it all cross-sectional snapshots?"**
→ Big unsolved problem. If they're not doing it yet, it's a gap you could fill.

**"After the 2024 election (Harris 53-47 vs. reality) — what did the post-mortem look like?"**
→ Ask with genuine curiosity. Every modeler has a miss they learned from. Let him tell the story.

---

## 🍺 Rapport (Let These Happen Naturally)

- FSU → startup — what surprised him most?
- Still publishing? Any active research?
- Running? (John runs, you run)
- The neighborhood — does he live nearby?

---

## ⛔ Don't

- Don't oversell PRISM — if he asks: "I built a political disposition model with 111 archetypes, theory-driven layers, calibrated against real elections. Happy to show you."
- Don't ask about comp/equity at drinks
- Don't critique the 2024 miss — ask what they learned
- Don't monopolize — he's a professor, he likes explaining. Let him riff.

---

## After

- Update this file with answers
- Update `briefs/aaru-work-trial-3-week-plan.md` with new intel
- Thank-you text next day
- If he sends manuscript, read within 48h and send specific comments
