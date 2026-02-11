# Prior Design for the Serif Causal Engine

## What This Document Covers

Every causal edge in Serif needs a Bayesian prior distribution — a statement of what we believe about the dose-response relationship before seeing any of this person's data. This document lays out all the design decisions, open questions, and options for how to build these priors well. It covers the dose assignment problem, the threshold problem, the joint structure problem, the actionability constraint, and how personal data should update population knowledge.

---

## 1. What the Prior Does and Why It Matters

The BCEL model for each edge is:

```
y = alpha + beta_below * max(0, theta - x) + beta_above * max(0, x - theta) + noise
```

Where x is the dose (what you do), y is the response (what changes), and theta is where the curve bends. The prior tells the model what values of theta, beta_below, and beta_above are plausible before looking at any personal data.

The prior serves two purposes. First, regularization: with sparse data (6 lab draws for iron, 160 body fat readings), the data alone cannot reliably pin down a 5-parameter model. Without a prior, the optimizer would overfit — finding a theta that perfectly explains noise. The prior prevents this by saying "theta should be near where the literature says it is, unless your data strongly disagrees."

Second, the prior encodes population knowledge. When a new user joins Serif with zero personal data, the prior IS the entire prediction. For Oron right now, with 6 lab draws, the slow-marker edges are roughly 80% prior and 20% personal data. The daily edges (sleep, HRV) with 1,000+ observations are roughly 5% prior and 95% personal data. This weighting happens automatically through Bayes' theorem — more data means the likelihood dominates the prior.

This means the prior matters enormously for the lab-based edges. If the prior on running→iron is wrong, the insight will be wrong, because there isn't enough personal data to override it. Getting these priors right is not a nice-to-have; it determines whether the iron insight is trustworthy.

---

## 2. The Dose Assignment Problem

For each edge, we must decide what "dose" means concretely. The dose is an operationalization of some behavior or state into a single number that goes on the x-axis of the dose-response curve. There are several dimensions to this choice.

### Time window

The biological timescale of the response determines the appropriate dose window. Iron depletion from running happens over weeks to months — a single 15km run doesn't change your serum iron, but four weeks of 50km/week does. So the dose for running→iron should be a multi-week aggregate, not a daily value. Conversely, the effect of tonight's bedtime on tonight's deep sleep is immediate — a single-night dose.

The current system handles this through the DoseFamily's `window_by_timescale` dictionary, which maps biological timescale (fast/medium/slow) to a time window and aggregation. For slow markers, we use 28-day windows. For fast outcomes, 1-day. This is reasonable, but the prior must match the operationalization. A prior derived from a study measuring "weekly running volume" cannot be applied directly to a model using "monthly running volume" — the units and scale differ.

### Aggregation method

Should the dose be the sum, mean, or max over the window? For running→iron, total km (sum) makes sense because total foot strikes drive hemolysis — two 25km weeks equal one 50km week in cumulative damage. For bedtime→sleep quality, the value on that specific night matters (last). For ACWR, it's already a computed ratio.

The aggregation choice changes what the beta coefficient means. If dose = sum of daily km over 28 days, then beta = -0.001 means "per km of monthly running." If dose = mean of daily km over 28 days, then beta = -0.028 means "per km/day of average running." Same underlying relationship, different numbers.

### Units and scaling

The dose units determine the magnitude of beta and therefore the magnitude of the prior. If we measure running in km/month, a beta_above of -0.02 mcg/dL per km/month means the same thing as -0.56 mcg/dL per 10km/week. The literature typically reports effects in specific units ("per 10 km/week increase in running volume"). The prior must be translated into whatever units the model actually uses.

This is where errors creep in. If a study reports "ferritin decreases by 2 ng/mL per 10 km/week of running volume increase" and our model uses monthly km as the dose, we need to convert: 2 ng/mL per 10 km/week ≈ 2 ng/mL per 43 km/month ≈ 0.047 ng/mL per km/month. Getting this wrong by a factor of 4 means the prior is misleading.

### The implication for prior design

Every prior specification needs to explicitly state the dose units, the time window, the aggregation, and provide a conversion trail from the source literature units to the model units. The current PriorSpec has theta_unit and per_unit fields, but these are display-only — they don't enforce consistency with the actual model parameterization. A better system would derive the prior parameters from the literature values and the known dose operationalization, rather than requiring manual conversion.

---

## 3. The Threshold Problem

The threshold theta represents the dose level where the dose-response relationship changes character. This is the most novel and most uncertain part of the model.

### What theta means biologically

For different curve shapes, theta means different things:

- **Plateau_up** (e.g., zone 2→HDL): Below theta, more exercise increases HDL. Above theta, gains flatten. Theta is the saturation point — "you get most of the benefit by doing at least this much."

- **Plateau_down** (e.g., running→iron): Below theta, running has mild effect on iron. Above theta, iron drops steeply. Theta is the damage threshold — "below this you're fine; above this you're depleting."

- **V_max** (e.g., steps→sleep efficiency): Below theta, more activity helps sleep. Above theta, more activity hurts sleep. Theta is the sweet spot — "this is the optimal dose."

- **V_min** (e.g., ACWR→hsCRP): Below theta, inflammation is low. Above theta, inflammation rises. Theta is the tipping point — "stay below this."

- **Linear**: No meaningful threshold. Beta_below ≈ beta_above. The model still estimates a theta, but it doesn't matter because both slopes are similar.

### Where theta comes from

The prior on theta can come from several sources:

1. **Published thresholds**: Some studies explicitly report thresholds. For example, the ACWR literature identifies 1.3 as a risk threshold. Sleep studies identify ~7 hours as a sufficiency threshold. These are strong anchors.

2. **Dose-response curve inspection**: Some studies report dose-response curves without explicitly calling out a threshold. You can visually or statistically identify where the curve bends. This is weaker — the "threshold" is an artifact of the piecewise linear parameterization, not necessarily a biological discontinuity.

3. **Physiological reasoning**: For foot-strike hemolysis, the threshold is where hemolysis rate exceeds the body's iron replacement rate (~1-2 mg/day). This depends on iron intake, absorption efficiency, and other individual factors. You can estimate a range but not a precise number.

4. **No basis for a threshold**: For some edges, there may be no evidence of a threshold — the relationship may be genuinely linear. In this case, the prior on theta should be diffuse (wide sigma), and the model should be able to find that beta_below ≈ beta_above (i.e., linear is a valid posterior even though the model is piecewise).

### Dynamic thresholds

Theta is not a fixed constant. It varies across individuals and over time within an individual. Oron's iron depletion threshold when he was supplementing iron in 2023 is different from his threshold in 2024 when he wasn't. His overtraining threshold when highly fit is different from when detrained.

The current model treats theta as a single value estimated from all data. This works if the threshold hasn't changed much over the observation period, which is a reasonable assumption for most of the edges (the biology doesn't change that fast). But it's worth acknowledging that the estimated theta is an average over the observation period.

A more sophisticated approach would be to allow theta to drift over time (a time-varying changepoint model), but this requires much more data and is likely overkill for the current system. The better strategy is to (a) estimate a single theta with uncertainty and (b) let the uncertainty band capture the plausible range of individual-specific thresholds.

### How wide should the prior on theta be?

This is a crucial question. A tight prior (small sigma_theta) says "we're confident the threshold is here, and personal data should only move it a little." A wide prior says "we don't really know where the threshold is; let the data decide."

The right width depends on how well-studied the relationship is and how variable the threshold is across individuals:

- **ACWR→hsCRP**: The 1.3 threshold is well-established across many studies. Sigma_theta = 0.2 is appropriate. Individual variation exists but is relatively small.
- **Running→iron**: The threshold depends on individual iron status, diet, and absorption. Sigma_theta = 10-15 km/week is appropriate for a prior of ~40 km/week.
- **Bedtime→deep sleep**: Circadian timing varies a lot across individuals (chronotype). Sigma_theta = 1-2 hours is appropriate.
- **Steps→sleep efficiency**: Very little literature on a threshold. Sigma_theta should be wide — maybe 3000-5000 steps around a mean of 10,000.

---

## 4. The Joint Prior Problem

This is the most subtle and important design issue. Currently, the priors on theta, beta_below, and beta_above are independent Normal distributions. But they are not independent quantities.

### Why independence is wrong

Consider running→iron with theta ~ N(40, 10) km/week, beta_below ~ N(-0.2, 0.15), beta_above ~ N(-0.8, 0.3).

If the optimizer is exploring theta = 25 km/week: nearly all of Oron's training (he runs 30-60 km/week) is above the threshold. So beta_above describes almost the entire observed dose range. It should be close to the overall average slope across the data.

If the optimizer is exploring theta = 55 km/week: most training is below the threshold. Beta_below now describes most of the data, and beta_above only matters for the highest-volume weeks.

Under independent priors, the optimizer can set theta = 25 AND beta_above = -0.8 (a steep decline above 25 km/week). But the literature prior of -0.8 was calibrated assuming theta ≈ 40. At theta = 25, the slope above 25 km/week should be gentler (because it's averaging across what was previously "below threshold" and "above threshold" territory).

In other words: the "true" prior is on the shape of the dose-response curve, not on the individual parameters. The parameters are just one way of describing that shape, and their interpretation changes depending on each other.

### Options for handling this

**Option A: Keep independent priors, tighten theta.**
If the prior on theta is tight enough (sigma_theta small), the beta priors don't need to adjust much because theta doesn't move far. This is the simplest fix. For well-studied thresholds (ACWR, sleep duration), this works. For poorly-studied ones, it's a cop-out — you're pretending to be more certain about theta than you are.

**Option B: Specify priors as reference points on the curve.**
Instead of specifying (theta, beta_below, beta_above) directly, specify what you believe the dose-response curve looks like at specific doses:

```
At dose = 20 km/wk: slope = -0.1 ± 0.1 (mild effect)
At dose = 40 km/wk: slope = -0.5 ± 0.2 (moderate)
At dose = 70 km/wk: slope = -1.2 ± 0.4 (severe)
```

Then a conversion function derives the implied joint distribution on (theta, beta_below, beta_above). If the reference points say "flat at low dose, steep at high dose," the converter finds that theta must be between the flat and steep regions, and beta_above must be steeper than beta_below. The joint structure falls out naturally.

This is more intuitive to specify from literature (researchers report effects at specific doses, not piecewise linear parameters) and automatically captures the dependence between theta and the betas. It's more work to implement but fundamentally more correct.

**Option C: Reparameterize the model.**
Instead of (theta, beta_below, beta_above), parameterize the model as (theta, beta_average, beta_difference):

```
beta_average = (beta_below + beta_above) / 2  — the overall trend
beta_difference = beta_above - beta_below      — how much the slope changes at theta
```

In this parameterization, beta_average is relatively independent of theta (it describes the overall trend regardless of where the kink is), and beta_difference captures the changepoint effect. Priors on beta_average and beta_difference are more naturally independent of theta than priors on beta_below and beta_above.

This is a middle ground — easier to implement than reference points, more correct than fully independent priors. The prior on beta_difference directly captures "how much does the curve bend at the threshold" which is the biologically meaningful quantity.

**Option D: Use a non-parametric curve prior.**
Replace the piecewise linear model with a Gaussian Process or spline model where the prior is on the smoothness and amplitude of the curve, not on specific parameters. This avoids the threshold problem entirely — the model finds whatever shape the data supports. But it loses the interpretability of theta (no single "threshold" to report) and requires more data to estimate.

### Recommendation

Option B (reference points) is the most principled and produces the best priors for the literature-backed edges. Option C (reparameterization) is a good engineering compromise that improves on the status quo with less effort. Option A (tighten theta) is acceptable for well-studied edges where we're genuinely confident about the threshold location.

A practical approach might be: use Option B for the highest-stakes edges (running→iron, running→ferritin, training→testosterone) where the prior really matters because data is sparse, and Option A/C for the data-rich edges (daily HRV, sleep) where the prior is quickly overwhelmed by data anyway.

---

## 5. Controllability and Actionability

Every edge in Serif should connect something the user can influence (directly or indirectly) to something they care about. Otherwise the insight is descriptive but not prescriptive — "your iron is low because you run a lot" is more useful than "your iron is correlated with the time of year."

### The COMPLE constraint

The system already enforces C/L → M/O: the parent must be a Choice or Load, the child must be a Marker or Outcome. This rules out E→M edges (season→iron would be a confounding path, not a causal one to present as actionable).

But there are gradations of controllability:

**Directly controllable (C)**: Running volume, bedtime, workout intensity. The user decides these every day. An insight like "run less than 40 km/week to protect your iron" is directly actionable.

**Indirectly controllable (L)**: ACWR, training consistency, sleep debt. These are derived from daily choices accumulated over time. The user can't "set" their ACWR — they set their daily training, which determines ACWR. An insight like "your ACWR is 1.5 — scale back this week" is actionable but requires understanding that today's training affects next week's ACWR.

**Partially controllable (L/E boundary)**: Travel load. You can choose when to travel (sometimes), but often travel is externally imposed. The insight "budget 5 recovery days after your next Israel trip" is useful planning information even if you can't avoid the trip.

**Not directly controllable (M→M)**: Ferritin→VO2peak. You can't inject ferritin. But you can take iron supplements or reduce running, which raise ferritin, which then improves VO2peak. The chain is: Running (C) → Ferritin (M) → VO2peak (M). The M→M edge is an explanatory link within a longer causal chain.

### How to handle M→M edges

There are two options:

**Keep M→M as separate edges** and present them as explanatory: "Your ferritin level of 46 ng/mL is limiting your VO2peak. The threshold is ~37 ng/mL — you're above it but not by much." This is informative. The user understands why iron matters. But the actionable advice comes from the C→M edge (reduce running to protect ferritin, or supplement iron).

**Fold M→M into the causal chain** and present the full path: "Running at 50 km/week depletes ferritin, which limits VO2peak. Your ferritin is 46 (threshold ~37). To unlock higher VO2peak, either reduce running below 40 km/week or supplement iron to raise ferritin above 50." This is more useful because it connects the controllable lever to the outcome the user cares about.

The second approach is better for the user but harder to implement — it requires chaining edge effects through intermediate nodes. The system already has the frontdoor paths from the backdoor module (running → ground_contacts → iron → ferritin → hemoglobin → VO2peak), so the chain structure exists. The question is whether to present each link separately or as a unified narrative.

### Recommendation

Keep M→M edges in the model (they're needed for proper causal identification), but in the presentation layer, always connect them back to a controllable parent. The insight card for Ferritin→VO2peak should say "controlled via: running volume, iron supplementation" and link to the running→ferritin edge as the actionable lever.

---

## 6. How Personal Data Should Update Priors

The Bayesian machinery handles this automatically — the posterior is proportional to the likelihood times the prior. But there are practical questions about how this should work.

### The weighting problem

With 6 lab draws, the personal weight on slow-marker edges is low (~15-25%). The insight is mostly population prior. This is honest — we don't have enough personal data to override the literature. But it means the quality of the prior directly determines the quality of the insight.

With 1,000+ daily observations on HRV, sleep, and resting HR, the personal weight is high (~95%). The prior barely matters. Even a mediocre prior is quickly overridden by data.

This creates an asymmetry: the edges where the prior matters most (sparse lab data) are also the edges where the literature is most relevant (well-studied biomarkers with large meta-analyses). The edges where the prior matters least (dense daily data) are the ones where individual-level literature is weakest (how does YOUR sleep efficiency respond to YOUR bedtime?).

### Should the prior evolve over time?

As Oron gets more lab draws, the posterior from today becomes the prior for tomorrow. This is sequential Bayesian updating and it's the natural approach. The question is whether to ever "reset" the prior — for example, if Oron starts iron supplementation, the running→iron relationship changes fundamentally (iron loss is partially offset by supplementation). Should the prior reset to population, or should it carry forward the personal posterior?

The right answer depends on what changed. If Oron's biology changed (started supplementing, changed training modality), the old personal data is less relevant and the prior should partially reset. If he just accumulated more data under the same conditions, sequential updating is correct.

The current system doesn't handle regime changes. A future enhancement could detect structural breaks (e.g., iron supplementation start date) and segment the data accordingly. But this requires knowing when the regime change happened, which is a separate detection problem.

### Display and transparency

The certainty scale (personalWeight / populationWeight / confidence) should be displayed prominently. Users need to understand that "your threshold for running→iron is 42 km/week" is mostly a population estimate, while "your bedtime threshold for deep sleep is 20:00" is mostly personal data. The confidence level should influence how strongly the system makes recommendations — a high-population-weight insight should be presented as "population research suggests..." while a high-personal-weight insight can say "your data shows..."

---

## 7. The Research Task Per Edge

For each of the 27 edges, we need to establish:

1. **The dose-response shape**: Is it linear, threshold, U-shaped, or inverted-U? This determines the curve type prior (and whether a threshold even exists).

2. **The effect size**: What is the expected magnitude of the effect? In what units? With what confidence interval? This determines beta_below and beta_above priors (or reference-point slopes).

3. **The threshold location** (if applicable): At what dose does the relationship change? How variable is this across individuals? This determines the theta prior.

4. **The dose range studied**: What dose range did the research cover? If the studies only cover 0-30 km/week and Oron runs 50 km/week, we're extrapolating beyond the evidence.

5. **The population**: Were the subjects athletes, sedentary adults, elderly? Male, female? Age-matched? The closer the study population to Oron (33-year-old male endurance athlete), the better the prior.

6. **Known effect modifiers**: Does the relationship differ by sex, age, fitness level, diet, supplementation status, climate? This connects to the location effect modification analysis.

7. **The individual-vs-population gap**: Studies report average effects across groups. Individual responses vary. A meta-analysis finding "running reduces iron by 0.5 mcg/dL per 10 km/week on average" might have individual-level variation of ±1.0 mcg/dL. The prior should reflect this individual-level uncertainty, not the narrower group-level CI.

8. **The causal identification in the source study**: Was the study an RCT (strong causal evidence), a prospective cohort (moderate), or cross-sectional (weak, possibly confounded)? The prior should be wider for weaker evidence.

This is a substantial research effort — 27 edges × 8 dimensions. The highest priority are the edges where the prior matters most: the sparse-data, high-clinical-significance ones. For Oron, that's:

- Running→iron (6 data points, critical health issue)
- Running→ferritin (6 data points, critical)
- Training→testosterone (6 data points, clinically relevant)
- Zone 2→triglycerides (6 data points)
- Zone 2→HDL (6 data points)
- ACWR→hsCRP (6 data points)
- Ferritin→VO2peak (6 data points, cross-link)

The daily edges (sleep, HRV, resting HR) with 1,000+ observations are lower priority for prior research because the data will dominate anyway.

---

## 8. Putting It All Together: A Proposed Process

### For each edge:

**Step 1: Define the dose operationalization.** What column, what window, what aggregation. This is already done in edge_discovery.py, but needs to be locked in before specifying the prior.

**Step 2: Research the literature.** Find the best meta-analysis or systematic review. Extract effect sizes, dose ranges, thresholds, and uncertainty. Note the study population and design quality.

**Step 3: Specify the prior as reference points (Option B).** For the dose range relevant to Oron, state what the literature says the effect should be at 2-3 dose levels. Include uncertainty. For example:

```
Running → Iron (dose: monthly running km)
  At 80 km/month:  iron change = -0.5 ± 0.3 mcg/dL per 40 km/mo
  At 160 km/month: iron change = -2.0 ± 1.0 mcg/dL per 40 km/mo
  Breakpoint: 100-160 km/month (30-50 km/week equivalent)
  Source: Sim et al., Sports Med 2019 (meta of 24 studies, n=1,200)
  Study quality: systematic review of prospective cohorts
  Population: endurance athletes, 70% male, mean age 28
  Individual variability: ~2× the group-level CI
```

**Step 4: Convert reference points to model parameters.** A function takes the reference points and the dose operationalization and produces the (theta, beta_below, beta_above) joint prior. This conversion ensures units match and captures the theta-beta dependence.

**Step 5: Validate.** Check that the prior produces sensible dose-response curves by sampling from it. Do the sampled curves look like what the literature describes? Are there pathological cases (e.g., curves that cross zero twice, or slopes that are biologically impossible)?

**Step 6: Record the provenance.** Every prior gets a citation, a study quality rating, a population match score, and a note on how individual-level uncertainty was estimated. This is stored alongside the prior and displayed to the user for transparency.

### The PriorBuilder

The implementation would be a PriorBuilder class or module that:
- Takes reference-point specifications as input
- Knows the dose operationalization (units, window, aggregation)
- Converts reference points → PriorSpec parameters
- Validates the resulting prior by sampling
- Stores the full provenance chain

This replaces the current hand-coded PRIORS dictionary in population_priors.py with a more structured and auditable system.

---

## 9. Summary of Decisions Needed

1. **Reference-point priors vs. parameter priors vs. reparameterization**: Which approach to use for specifying priors? Reference points (Option B) are most principled. Reparameterization (Option C) is a lighter-weight improvement. Independent parameters (Option A, current) are simplest but have the joint-prior problem.

2. **M→M edges**: Keep as separate insights? Fold into causal chains? Or both?

3. **Research depth**: Deep dive on all 27 edges, or prioritize the 7 sparse-data edges where the prior dominates?

4. **Prior width calibration**: How much individual-level variability to add on top of study-level CIs? A common heuristic is 2× the group CI, but this is a guess.

5. **Regime changes**: How to handle supplementation, injury, or other changes that alter the dose-response relationship? Ignore for now, or build in structural break detection?

6. **Display**: How prominently to show the prior-vs-data weighting? Should insights with >70% population weight look visually different from those with >70% personal weight?
