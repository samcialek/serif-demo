# PRISM Quiz Engine Scaffold

This is a metadata-driven adaptive quiz engine scaffold for the PRISM archetype system.

## Current modeling assumptions

- 15 PRISM L3 nodes total
- 12 continuous nodes:
  - MAT, CD, CU, MOR, PRO, COM, ZS, ONT_H, ONT_S, PF, TRB, ENG
- 3 categorical nodes:
  - EPS, AES, H
- Salience for every node:
  - 0, 1, 2, 3
- Salience 0 and 1 are omitted from primary archetype-distance matching
- Salience 2 and 3 are included
- CNA is deleted as a base node
- TRB anchor is modeled as a conditional payload, not a new node

## What this scaffold does

- defines node/archetype/question metadata types
- defines sample archetypes
- defines 10 representative questions
- maintains respondent state
- updates node posteriors from answers
- computes archetype posterior-like scores
- classifies nodes as dead/live_resolved/live_unresolved
- scores unanswered questions for exposure
- evaluates a stop rule

## What is intentionally incomplete

- full 111 archetypes from the atlas
- full 63-question metadata bank
- polished category sets and cost matrices
- browser UI

## Run

```bash
npm install
npm run dev
```
