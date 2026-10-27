# Churn Compass Lab

Build a polished, complete FRONTEND web app called “ChurnLab” for the Utkrishta 2026 Challenge 1: Autonomous AI Data Scientist. The challenge is budget-constrained telecom customer churn prediction, with a maximum of 15 model-training experiments; one fit-and-validation cycle is one experiment. ROC-AUC is the primary metric; PR-AUC / Average Precision is secondary. The user is a beginner assigned to Role 2 (modeling and pipeline lead), so the interface should make pipeline work and handoffs understandable.

IMPORTANT SCOPE: frontend only. Do not add authentication, database, Supabase, server functions, external ML APIs, paid APIs, or pretend an actual model is trained. Build a polished interactive prototype using realistic, clearly labeled sample/demo data. Use local browser state/localStorage for experiment entries and preferences. Any sample metrics or scores must say “Demo data” / “Illustrative only”; never imply they are actual organizer hidden-test results or actual model outputs. Include helpful empty states and in-product explanations. Use the Lovable default React + TypeScript + Tailwind + shadcn stack.

PRODUCT / UX:
Create “ChurnLab” as an elegant data science experiment cockpit, desktop-first but responsive, with a left sidebar, compact top bar, clean white/light canvas, deep navy text, calm blue/teal accents, fine borders, restrained shadows, clear typography, accessible contrast, no huge gradients or generic AI imagery. Make it look credible for a university hackathon demo, not a generic SaaS template.

NAVIGATION / SCREENS (sidebar routes or equivalent):
1) Overview: challenge title and one-line goal; a clearly visible experiment budget meter (0/15 or demo seeded count), current project stage; KPI cards for best validation ROC-AUC and PR-AUC with Demo badge; a validation score progression chart; recent runs; clear next-step card for Role 2; small “Challenge rules” panel showing 15-run cap, ROC-AUC primary, PR-AUC secondary, hidden test labels unavailable.
2) Dataset: local CSV upload/dropzone, parse/preview CSV in browser only, show row count, columns, detected target, missingness summary, feature-type chips (numeric/category), and warnings for possible ID/target/leakage review. Do not send uploaded data anywhere. Let user pick the churn target column and exclude ID columns through UI. Include beginner explanations: target = answer, features = clues, ID = row label, missing = unknown not zero. For empty state offer a built-in synthetic sample dataset that is explicitly labeled illustrative. Provide no claims of real performance.
3) Pipeline: visual step flow: raw customer rows -> split train/validation -> prepare numeric fields (fill blank, scale) and categories (fill blank, one-hot encode) -> classifier -> probability/risk score -> metrics. Explain “fit only on training data” and leakage with short friendly tooltips/cards. Show model selector (Logistic Regression baseline, Random Forest, Gradient Boosting) as selection UI; clearly indicate model training requires connecting the Python/Colab pipeline and is not performed in this frontend prototype. Provide pipeline handoff checklist for Role 2.
4) Experiments: interactive experiment ledger/table with run number, hypothesis, model, change/settings, ROC-AUC, PR-AUC, runtime, decision/lesson, status. Add “Log experiment” modal/form, enforce max 15 entries, display remaining budget and confirmation; allow editing/deleting demo/local entries; every seeded demo row has Demo label. Let user add a planned run without counting it until status changes to completed; count each completed fit+validation run as 1. Explain Person 3 owns the counter and should approve runs. Show why/how to compare runs fairly.
5) Evaluation: metric cards and simple explanatory charts; ROC-AUC / PR-AUC definitions in plain English; validation-vs-hidden-test distinction; show experiment trajectory and baseline comparison using demo-labeled sample data. Include “What this means” insight cards but all demo insights labeled as illustrative.
6) Predictions: local CSV preview flow and downloadable example output if feasible; if no real connected trained model exists, do NOT produce fake “real” predictions. Show a clear message that real churn-risk scores require the saved trained Python pipeline; provide an illustrative-only sample table with made-up scores and obvious badge. Preserve IDs separately from model features in the example and explain IDs match predictions back to rows.
7) Presentation: 10-slide checklist matching official required content: team/track/summary; problem/motivation; dataset/EDA/preprocessing; system diagram; core algorithm/planner; experiment log; evaluation; results; demo/predictions; failure modes/future work. Interactive checklist with local state and progress.

INTERACTION DETAILS:
- Sidebar navigation changes pages and active state.
- CSV upload parses safely in browser (PapaParse if needed), preview rows and inferred columns; user can use/reset synthetic sample.
- Experiment modal validates required fields and numeric metric ranges. Block adding completed run after 15 and explain limit. Sort latest/best, filter status, view run details. Store demo/user experiment ledger locally.
- Presentation checklist persists locally.
- Buttons do something meaningful; no dead UI. Add helpful empty states, inline help/tooltips, and responsive sidebar/menu.
- Provide a header indicator “Frontend demo • model not connected” so the user can explain it honestly.
- Add a polished demo walkthrough seeded with a few believable SAMPLE runs if it improves first impression; each such run, chart, score, insight, risk score and output must be visibly labeled sample/demo/illustrative. Provide a one-click reset to an empty project state.

Build the complete app and finish with a live preview. Add concise content that follows the official challenge constraints above. Ensure there is no backend and no credential requirement.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://churn-compass-lab.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5b9a08bc-b75a-4f3b-b199-71899cfa2cbb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
