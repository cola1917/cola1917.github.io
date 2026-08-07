---
title: "NeuralSceneBridge: editable NuRec scenes and multimodal renderer diagnosis"
description: "A reproducible scene-0061 NuRec playback, dynamic-actor edit, camera-pose probe, and RGB/LiDAR alignment investigation built around SensorsimService."
year: 2026
timeframe: "2026 - present"
status: active
role: "Independent engineering: NuRec runtime, evidence contracts, and diagnostics"
stack:
  - Python
  - NVIDIA NuRec / NRE
  - gRPC
  - USDZ
  - PANDAR128 LiDAR
metrics:
  - "scene-0061 / 39 frames / 6 cameras"
  - "V01-V03 reproducible / V04 unresolved"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/NeuralSceneBridge"
  - label: "ClosedLoopBench"
    url: "https://github.com/cola1917/ClosedLoopBench"
featured: true
order: 95
draft: false
locale: en
---

## Positioning

`NeuralSceneBridge` is an independent NuRec/NRE neural-scene reconstruction and editable-rendering demo. It sends a trained USDZ scene to NVIDIA `SensorsimService`, replays six cameras, edits one dynamic target, and turns requests, responses, hashes, and videos into reviewable evidence.

The current delivery is **open-loop**: a fixed scene and trajectory go in, reproducible renders and diagnostics come out. It does not start CARLA and it does not own ego control, braking, TTC, or collision evaluation. `ClosedLoopBench` is the future owner of the CARLA synchronous clock, control boundary, and evaluation loop.

> **Bottom line: the final RGB/LiDAR result is not physically aligned yet.** `status: passed` in V04 means that 385 render windows and the capture gate completed; it does not mean world-frame consistency or per-actor point ownership passed.

<div class="project-flow" role="img" aria-label="NeuralSceneBridge pipeline">
  <div class="project-flow-step"><span>01</span><strong>Manifest gate</strong><small>USDZ, checkpoint, track inventory</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>NuRec gRPC</strong><small>render_rgb / render_lidar</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Case matrix</strong><small>replay, actor edit, pose sweep, V04</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>videos, JSON, quality report, diagnosis</small></div>
</div>

## What is actually proven

| Case | Operation | Retained evidence | Claim boundary |
| --- | --- | --- | --- |
| V01 | Original trajectory replay, six cameras in a 3x2 grid | 20/30 FPS videos, 385 frames, zero dropped frames | Scene and sensor requests are reproducible |
| V02 | Translate track `c1958768...` by `+0.5m` in the world frame | A/A/B request digest, RGB repeatability, target-only change | Dynamic edits reach the RGB response; non-target digest stays unchanged |
| V03 | Bounded camera sweep: `x=0.12m`, `y=0.06m`, `yaw=1.0°` | Probe summary, pose readout, trajectory extrema | Camera pose control is measurable and replayable |
| V04 | Original/edited RGB and LiDAR in a four-panel view | Same logical-window capture evidence | Alignment is investigated and visualized, not proven |

## Viewer evidence

These images are stills extracted from the final playback videos. The camera labels, case labels, and V03 pose readout are retained so the request-to-render-to-evidence relationship is visible in one glance.

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/neural-scene-bridge/v01-original.jpg" alt="V01 six-camera original NuRec replay in a 3x2 layout" width="1600" height="600" loading="lazy" />
    <figcaption>V01 original replay: six cameras are stitched in a fixed 3x2 order as the playback baseline for edits and probes.</figcaption>
  </figure>
  <figure>
    <img src="/projects/neural-scene-bridge/v02-edit.jpg" alt="V02 lead vehicle edit in the six-camera NuRec viewer" width="1600" height="600" loading="lazy" />
    <figcaption>V02 lead-vehicle edit: a world-frame `+0.5m` target change reaches `render_rgb`; the front-camera view and case identity stay inspectable.</figcaption>
  </figure>
  <figure>
    <img src="/projects/neural-scene-bridge/v03-camera-sweep.jpg" alt="V03 six-camera bounded camera pose sweep with translation and yaw readout" width="1600" height="600" loading="lazy" />
    <figcaption>V03 camera pose sweep: `dx / dy / yaw / progress` is printed in the viewer, showing that pose control reaches the RPC request.</figcaption>
  </figure>
</div>

## V04: turning “not aligned” into a diagnosis

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/neural-scene-bridge/v04-alignment-diagnostic.jpg" alt="V04 four-panel RGB and LiDAR multimodal alignment diagnostic with added and removed points" width="1600" height="900" loading="lazy" />
    <figcaption>V04 multimodal attempt: original RGB/LiDAR are above, edited RGB and the LiDAR overlay are below. Blue/yellow points show response differences; they are not actor-owned point labels.</figcaption>
  </figure>
</div>

The M8 open-loop record in `ClosedLoopBench` breaks the investigation into falsifiable steps instead of jumping straight to “the coordinates are wrong”:

| Layer | Check | Conclusion |
| --- | --- | --- |
| Request | The same `dynamic_objects` payload changes RGB at the true target pixels | The client-side `track_id + pose_pair` path is valid |
| Coordinates | Correct the old NuRec LiDAR axis matrix, then compensate the measured `-1m` sensor-height offset | The transform fixes are real, but do not explain the remaining collapse |
| Modality isolation | `NRE RGB + raw LiDAR` recovers detections; `raw RGB + NRE LiDAR` remains at 0 matches and mAP50 0 | RGB is not the main bottleneck; reconstructed LiDAR is |
| Server A/B | target-only / empty / all-minus-target produce essentially the same returns near the true ROI; 34.7m and 100m target poses produce the same 136 extra cells | The NuRec 26.04 dynamic LiDAR path does not apply the per-track cuboid pose correctly |

The live probe is more specific: RGB follows the requested target pose, while most vehicles contribute no LiDAR returns at their true positions. Rendering a vehicle alone produces a fixed scatter roughly 12m forward. The `ClosedLoopBench` diagnosis is that the NRE 26.04 server-side dynamic LiDAR renderer, or a checkpoint/runtime convention mismatch, places dynamic Gaussians near `canonical_position + lidar_extra_signal` without applying each track's cuboid transform before raycasting. Until NVIDIA confirms the implementation, this page calls it a server-path diagnosis/upstream limitation rather than a repaired product bug.

## Engineering boundary

- **Completed**: canonical artifact/checkpoint identity gates, 223-track inventory validation, V01/V02/V03 rendering, V02 A/A/B repeatability, V03 bounded camera probing, and V04 capture evidence.
- **Not completed**: source-timestamp-faithful full-dynamic replay, true RGB/LiDAR actor ownership, perception-grade reconstructed LiDAR, or a CARLA closed-loop score.
- **Explicitly not claimed**: NeuralSceneBridge does not own CARLA `world.tick()` and does not claim that an ego vehicle brakes, avoids, or changes its next trajectory from these renders.

The next integration step is a shared timestamp, coordinate-frame, sensor-pose, and actor-binding contract. `ClosedLoopBench` can then own the CARLA synchronous clock and rerun its same-frame actor-aware bbox gate. If the upstream dynamic LiDAR path remains unresolved, the next experiment is a denser `lidar-sweeps` reconstruction or a new checkpoint, not another unverified downstream coordinate patch.

## Code map

- `demo/scene0061/manifest.json`: canonical USDZ/checkpoint, scene interval, target track, and runtime identity.
- `demo/scene0061/cases/`: V01 original replay, V02 lead-vehicle edit, and V03 camera-pose sweep.
- `scripts/render_counterfactual_video.py`: sends per-case `render_rgb` requests and builds evidence-backed six-camera videos.
- <code>scripts/<wbr />render_multimodal_alignment_video.py</code>: captures V04 RGB/LiDAR windows and the difference overlay.
- `scripts/generate_nurec_quality_report.py`: binds artifact, case, frame, video, and quality metrics into the formal report.
- `nurec_scene0061_final/`: local playback delivery; videos, USDZ, checkpoint, and raw data stay out of Git.
