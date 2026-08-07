---
title: "ClosedLoopBench: turning scenario contracts into testable simulation"
description: "A simulation-test layer that compiles Scenario IR, binds synchronized replay observations, and produces auditable open-loop evaluation evidence before the CARLA closed-loop runtime is accepted."
year: 2026
timeframe: "2026 - present"
status: active
role: "Independent engineering: scenario compilation, runtime contracts, observation binding, and evaluation evidence"
stack:
  - Python
  - CARLA 0.9.16
  - OpenSCENARIO / OpenDRIVE
  - ROS2 boundary
  - TransFuser++
  - NuRec / SensorsimService
metrics:
  - "Current delivery: CARLA / ROS open-loop evaluation complete"
  - "M8: 39 scored frames x 3 routes / 68 dynamic actors"
  - "Closed-loop status: blocked; retained routes: 0 fallback / 0 frame mismatch"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/ClosedLoopBench"
  - label: "TriggerEngine"
    url: "https://github.com/cola1917/TriggerEngine"
  - label: "NeuralSceneBridge"
    url: "https://github.com/cola1917/NeuralSceneBridge"
featured: true
order: 90
draft: false
locale: en
---

## Current delivery: CARLA / ROS open loop

Despite its name, the current delivered product is the **CARLA / ROS open-loop evaluation path**. It consumes `Scenario IR` from `TriggerEngine`, compiles OpenSCENARIO / OpenDRIVE / CARLA run artifacts, binds a synchronized GT replay through the ROS observation boundary, and evaluates TransFuser++ outputs against the same scene contract.

This CARLA/ROS open-loop path is reproducible and produces retained evidence. Model control can be logged, compared, and scored, but it does not choose the next Ego pose. It is a completed open-loop evaluation delivery, not an accepted closed-loop driving result.

<div class="project-flow" role="img" aria-label="ClosedLoopBench open-loop evaluation pipeline">
  <div class="project-flow-step"><span>01</span><strong>Scenario IR</strong><small>Scene, trajectory, actors, triggers</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Compiler</strong><small>XOSC / XODR / run config</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>GT replay</strong><small>One clock, fixed poses</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>Observations, inference, metrics</small></div>
</div>

## Evaluation: make the scenario auditable

Scenario mining output is not an evaluation result. The hard part is preserving identity, time ownership, sensor provenance, and failure semantics across several execution routes so that a low score can be attributed to the algorithm, RGB, LiDAR, calibration, or runtime rather than to an ambiguous handoff.

| Layer | Responsibility | Current claim |
| --- | --- | --- |
| Scenario | IR schema, scene identity, actor manifest, time windows | Scenario intent remains traceable |
| Exchange | `.xosc`, `.xodr`, CARLA run config, shared package references | Portable artifacts can be generated and checked offline |
| Replay | Frame ids, GT Ego/actor poses, synchronized replay | The logged trajectory owns the next pose |
| Observation | Native / NuRec / Harmonizer routes, ROS boundary, hashes | Route provenance and frame binding are auditable |
| Evaluation | Waypoints, bbox, latency, provenance, fail-closed reports | Metrics describe the recorded trajectory, not a policy-caused future |

`TriggerEngine` remains the source of mined events and Scenario IR. `NeuralSceneBridge` is the optional reconstruction and sensor-rendering provider. `ClosedLoopBench` owns the evaluation boundary between those artifacts and a future simulator or Ego-policy runtime.

## LiDAR problem discovery and debug

LiDAR debug is a diagnostic case produced by the evaluation pipeline, not a separate project claim. M8 compares three input routes over the same 39 scored frames and 68 dynamic actors:

| Route | RGB | LiDAR | Result |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches, vehicle AP50 `0.547`, mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches, mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | Same NuRec LiDAR | 23 predictions / 1 match, mAP50 `0.0016` |

The debug path is: establish native CARLA RGB/LiDAR as the reference, run reconstructed and harmonized inputs, validate the LiDAR axis matrix and sensor-height compensation, confirm that better geometry does not recover detection, swap one modality at a time, then probe the live NRE dynamic-LiDAR path after the cross-input result points to LiDAR.

The cross-input experiment makes the attribution stronger: `NuRec RGB + raw LiDAR` produces 21 matches and mAP50 `0.130`; `raw RGB + NuRec LiDAR` stays at 0 matches and mAP50 `0.0`. The reconstructed RGB is not the main bottleneck. The reconstructed LiDAR is.

## Same-frame view

These two images are both `frame_00000018` from the M8 sequence: one raw CARLA route and one reconstructed NuRec route. They are observations at the same replay index, not consequences of Ego control in a closed loop.

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/closed-loop-bench/raw-frame-018.jpg" alt="M8 open-loop raw CARLA camera frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>Raw route, frame 18: native CARLA RGB/LiDAR is the evaluation reference.</figcaption>
  </figure>
  <figure>
    <img src="/projects/closed-loop-bench/reconstructed-frame-018.jpg" alt="M8 open-loop reconstructed NuRec camera frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>Reconstructed route, frame 18: NuRec RGB is usable, while reconstructed LiDAR is not perception-ready.</figcaption>
  </figure>
</div>

## Closed-loop vision: blocked

The next stage is an interactive CARLA/ROS loop: Ego control changes the next simulator state, reactive actors respond, and the same evidence contract scores the run. The status is **blocked** by environment and sensor acceptance gates, not by a missing document-level architecture:

- the reconstructed dynamic LiDAR path must place returns at the true track pose;
- synchronous CARLA `world.tick()` must be owned by the runtime;
- one physical actor must be shown to react to Ego behavior;
- a real ROS2/GPU Ego policy must pass timeout, safe-stop, and provenance gates.

Until those gates pass, the project does not claim that model control changes the next pose or that reactive actors complete a closed-loop response. Fake runtimes, dry-run reports, and GUI smoke validate contracts and observability only.

## Next step: from replay to closed loop

The future runtime extends the existing contracts incrementally:

1. Freeze one Scene Package, actor-binding set, timestamp clock, and sensor-calibration contract.
2. Pass a real CARLA BasicAgent synchronous replay with `world.tick()` ownership.
3. Add one physical scripted or TrafficManager actor and prove a state change in response to Ego behavior.
4. Connect one real Ego policy through the ROS2/TCP plugin boundary with timeout, safe-stop, and control provenance.
5. Re-run the same-frame actor-aware RGB/LiDAR gate and a three-run acceptance matrix.

Only after those environment gates pass should the project be presented as a closed-loop benchmark result. The canonical M8 classification today is `open_loop_multimodal`.

## Code map

- `runners/build_nuscenes_exchange.py`: builds the portable scene exchange package.
- `runners/run_open_loop_transfuserpp_triplicate.py`: runs the three-route open-loop replay/evaluation.
- `runners/compare_open_loop_transfuserpp_triplicate.py`: binds route provenance and comparison evidence.
- `metrics/transfuserpp_m8.py`: evaluates intermediate outputs and actor-aware BEV metrics.
- `runners/validate_multimodal_closed_loop.py`: future fail-closed sensor gate; its presence is not proof that the real gate passed.
- `docs/open_loop_project_design.md`: current facts, contracts, and the closure roadmap.
