---
title: "ClosedLoopBench: open-loop testing for real driving algorithms"
description: "A CARLA / ROS2 test bench that runs real TransFuser++ inference on synchronized replay data, uses A/B evaluation to diagnose dynamic LiDAR editability, and defines the blocked path to closed loop."
year: 2026
timeframe: "2026 - present"
status: active
role: "Independent engineering: CARLA/ROS2 open-loop testing, real inference integration, multimodal evaluation, and failure diagnosis"
stack:
  - Python
  - CARLA
  - OpenSCENARIO / OpenDRIVE
  - ROS2
  - TransFuser++
  - NuRec / SensorsimService
metrics:
  - "Current delivery: CARLA / ROS2 open-loop test + real TransFuser++ inference"
  - "M8: 39 scored frames x 3 routes / 68 dynamic actors"
  - "0 fallback / 0 frame mismatch; closed-loop status: blocked"
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

## 1. Current delivery: CARLA / ROS2 open-loop testing

Despite its name, the current delivered product is a **CARLA / ROS2 open-loop test bench**. It consumes `Scenario IR` from `TriggerEngine`, builds CARLA and exchange artifacts, replays a synchronized GT trajectory, runs real TransFuser++ inference through the ROS2 observation boundary, and retains auditable evaluation evidence.

The test path is reproducible. Model control is logged, compared, and scored, but it does not choose the next Ego pose. This is a completed open-loop test delivery, not an accepted closed-loop driving result.

<div class="project-flow" role="img" aria-label="ClosedLoopBench open-loop evaluation pipeline">
  <div class="project-flow-step"><span>01</span><strong>Scenario IR</strong><small>Scene, trajectory, actors</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Compiler</strong><small>XOSC / XODR / run config</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>ROS2 + TF++</strong><small>Real algorithm inference</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>Observations, inference, metrics</small></div>
</div>

## 2. Real inference and evaluation

This is more than a compiler or fake-runtime demo. The real algorithm stack is exercised through one reproducible evaluation path:

| Stage | What ran | Evidence |
| --- | --- | --- |
| Native CARLA | CARLA RGB/LiDAR + ROS2/TransFuser++ | Real inference and intermediate traces |
| NuRec multimodal | NuRec RGB/LiDAR at pinned GT poses | 39-frame run, zero fallback and frame mismatch |
| M7 acceptance | Same open-loop contract over three seeds | 39/39 frames per seed |
| M8 comparison | Native, reconstructed, and Harmonizer routes | 39 frames, 68 dynamic actors, formal bbox evaluation |

The evaluation holds one Scenario IR, actor manifest, and frame clock across routes. It reports waypoint ADE/FDE, latency, synchronization health, provenance hashes, and actor-aware BEV bbox metrics for the recorded trajectory.

## 3. M8: find the LiDAR failure

M8 compares three sensor routes over the same 39 scored frames and 68 dynamic actors:

| Route | RGB | LiDAR | Result |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches, vehicle AP50 `0.547`, mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches, mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | Same NuRec LiDAR | 23 predictions / 1 match, mAP50 `0.0016` |

The native route is the reference. The reconstructed route completes inference and report validation, but detection collapses. That makes the result a sensor-quality finding, not a runtime failure.

## 4. LiDAR diagnosis summary

With the frame clock, actor manifest, model, and scorer held fixed, M8 continued through controlled variables, several local correction rounds, cross-input A/B, a 39-frame scale-up evaluation, and live NRE probes. `NuRec RGB + raw LiDAR` recovers part of the detection result, while `raw RGB + NuRec LiDAR` remains at zero. Moving an actor changes RGB, but LiDAR returns do not follow the true track pose.

The conclusion is therefore not simply “LiDAR scores are low”: the **dynamic LiDAR path is not currently editable**. Upstream NRE/SensorsimService does not correctly apply each track's cuboid pose during LiDAR rendering. The full failure sequence, controlled variables, and evidence chain are documented in [the detailed LiDAR debugging post](/en/blog/closed-loop-lidar-debug/) and the repository reproduction log [`open_loop_m8_debug_log.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/open_loop_m8_debug_log.md).

## Same-frame evidence

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

## 5. Closed-loop vision: blocked

The next stage is an interactive CARLA/ROS2 loop: Ego control changes the next simulator state, reactive actors respond, and the same evidence contract scores the run. The status is **blocked** by environment and sensor acceptance gates, not by a missing document-level architecture:

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
