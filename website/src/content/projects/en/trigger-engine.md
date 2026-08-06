---
title: "Trigger Engine: turning long-tail driving behavior into reviewable cases"
description: "A configurable rule engine for Waymo Open Dataset that mines high-value interactions from trajectories, maps, and traffic-light state, then exports frame-level evidence to a static viewer."
year: 2026
timeframe: "2026 - present"
status: active
role: "Independent engineering: architecture, rule engine, and evaluation tooling"
stack:
  - Python
  - Waymo Open Dataset
  - YAML DSL
  - Static HTML viewer
metrics:
  - "5 review tags / 183 events (viewer sample)"
  - "cut_in_confirmed: 21 scenes (viewer sample)"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/TriggerEngine"
featured: true
order: 100
draft: false
locale: en
---

## Positioning

`TriggerEngine` is an offline rule-based mining pipeline for Waymo Open Dataset interactive TFRecord shards. It turns trajectories, map geometry, traffic-light state, and VRU interactions into review cases that can be inspected by a person and replayed as regression evidence.

The current stage is **open-loop**: recorded scenarios go in, structured events and static viewers come out. It does not yet drive an agent or vehicle controller. The next stage will use the existing `Scenario IR` / `evaluation feedback` contracts to connect the mined cases to closed-loop simulation.

<div class="project-flow" role="img" aria-label="TriggerEngine pipeline">
  <div class="project-flow-step"><span>01</span><strong>Waymo TFRecord</strong><small>Trajectories, maps, lights</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>AlignmentContext</strong><small>Current frame and history</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Rules + operators</strong><small>Single-frame and temporal logic</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Review viewer</strong><small>Evidence, replay, iteration</small></div>
</div>

## The problem

Long-tail events are sparse in large driving datasets, so manual replay does not scale. A single-frame threshold is fast but noisy and hard to explain. The design goal is therefore not to label every frame; it is to emit a review event with a traceable reason for triggering.

## Key design decisions

### 1. Separate configuration from runtime

YAML rules pass through `RuleParser` and `RuleCompiler` into an active `ExecutionPlan`. At runtime, `TriggerEngine.evaluate(context)` accepts only an `AlignmentContext`. Operator registration, subject compatibility, and temporal source tags can fail fast before a batch run starts.

### 2. Compose frame signals into evidence-backed events

Single-frame rules emit `TagEvent`s. `TagTimeline` then composes them with `sustained` and `sequence` rules. The classic cut-in rule requires the same SDC-target pair to satisfy this sequence within 0.8 seconds:

```text
adjacent_vehicle -> cut_in_lateral_approach -> same_path_overlap
```

Step by step, the judgment is:

| Step | Intermediate tag | What it checks | Result |
| --- | --- | --- | --- |
| 01 | `adjacent_vehicle` | The same `sdc_pair` contains two vehicles, with a lateral gap of about 1.5 - 4.5m and longitudinal distance under 15m | Candidate enters the window |
| 02 | `cut_in_lateral_approach` | Both vehicles are moving; the target moves laterally toward ego and the headings converge | A cut-in is developing |
| 03 | `same_path_overlap` | Ego is still moving and the pair reaches the same-path geometry, with lateral error under 1.2m | Merge geometry is present |
| 04 | `cut_in_confirmed` | The same pair hits the steps in order within 0.8s; unmatched frames may exist between steps | Emit a review event |
| 05 | `cut_in_risk` | Add `low_ttc_pair` in the same temporal window | Raise review priority |

This is not “small lateral distance on one frame equals cut-in”. It is `single-frame tags -> TagTimeline -> ordered sequence -> review policy`. The final episode policy compacts consecutive hits by subject so one cut-in does not become a stream of duplicate events.

Adding `low_ttc_pair` upgrades the result to `cut_in_risk`. The event keeps supporting frame indices, timestamps, ego/target identity, and rule metadata so a reviewer can follow the evidence instead of seeing an unexplained boolean.

### 3. Make review semantics explicit

Intermediate signals remain `supporting` / `debug`; final analyst-facing items use `intent: review`. Episode and cooldown policies then compact repeated frame hits by subject. The current classic pack covers low-TTC, confirmed cut-in, map-aware red-light, SDC hard braking, VRU close interaction, blocked/unable-to-proceed, and lane-change conflict.

## Viewer evidence

These are screenshots from the actual review viewer. The index groups cases by review tag; the scenario view keeps EGO/TARGET, scenario id, frame, time, and the event summary in one inspection path.

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/trigger-engine/review-index.png" alt="TriggerEngine review index showing five review tags and 183 events" width="1280" height="720" loading="lazy" />
    <figcaption>Review index: 5 review tags / 183 events, organized for fast triage.</figcaption>
  </figure>
  <figure>
    <img src="/projects/trigger-engine/cut-in-view.png" alt="TriggerEngine viewer showing a confirmed cut-in with EGO and TARGET" width="1280" height="720" loading="lazy" />
    <figcaption>Confirmed cut-in: `cut_in_confirmed`, EGO/TARGET, frame 8, and t=0.80s are visible in the evidence view.</figcaption>
  </figure>
</div>

## Engineering value

| Layer | Implementation | Why it matters |
| --- | --- | --- |
| Data | Waymo adapter + alignment context | Stable rule inputs from raw proto data |
| Rules | YAML DSL + OperatorRegistry + RuleRegistry | New scenario logic without rewriting orchestration |
| Engine | `TagEvent`, `TagTimeline`, event policy | Explainability, temporal logic, and deduplication |
| Delivery | Batch summary + payload JSON + static HTML | Reviewable, shareable, regression-friendly output |

Performance work is profile-driven: SDC-only pair candidates and cheap geometry gates run before expensive TTC or lane matching. A recorded first-five-shard benchmark reduced engine time from `82.07s` to `9.01s` while keeping review output unchanged.

## Next step: open-loop to closed-loop

The current delivery boundary is offline mining plus evidence viewing. The next step is to compile high-value cases into executable scenario inputs, connect them to an agent/runtime, compare closed-loop behavior against the trigger conditions, and feed the evaluation result back as `evaluation feedback`. That turns TriggerEngine into the front end of a simulation-evaluation loop rather than a one-off filter.

## Code map

- `trigger_engine/data/`: readers, frame schema, and Waymo / nuScenes adapters.
- `trigger_engine/rules/`: DSL parser, AST, compiler, and rule execution.
- `trigger_engine/operators/`: kinematic, interaction, map, and review predicates.
- `trigger_engine/engine/`: orchestration, subject cache, temporal timeline, and event policy.
- `tools/run_review_batch.py`: batch scanning, profiling, and viewer artifact generation.
