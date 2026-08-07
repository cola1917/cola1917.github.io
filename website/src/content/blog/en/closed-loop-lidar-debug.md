---
title: "From Detection Collapse to Root Cause: Debugging Dynamic LiDAR Editability"
description: "A complete record of the ClosedLoopBench M8 debug path: controlled variables, coordinate fixes, cross-input A/B tests, 39-frame scale-up evaluation, and the live probe that exposed the dynamic LiDAR pose bug."
publishedAt: 2026-08-07
updatedAt: 2026-08-07
tags:
  - carla
  - ros2
  - lidar
  - multimodal
  - debugging
featured: true
draft: false
locale: en
---

This post records the full sensor diagnosis behind ClosedLoopBench M8. The result was not obtained by running one A/B test and declaring that LiDAR was broken. The investigation started with a reproducible open-loop test, froze the causal variables, corrected local calibration hypotheses, replaced one modality at a time, scaled the comparison to 39 frames and 68 actors, and finally probed the live rendering service with edited actor poses.

## The conclusion first

The delivered system is a CARLA / ROS2 open-loop test path. Scenario IR ground-truth trajectory owns the next Ego pose, while real TransFuser++ inference runs through the ROS2 observation boundary and produces traceable outputs. Model control is recorded and scored, but it does not drive the next simulator state.

The M8 conclusion is specific:

- reconstructed RGB is not the main bottleneck;
- reconstructed LiDAR collapses the fusion detector;
- same-frame cross-input A/B and larger three-route evaluation rule out a one-frame accident, RGB distribution shift, and a downstream coordinate-only explanation;
- live probes show RGB responds to an actor pose edit while the LiDAR dynamic path keeps stored offsets instead of applying the per-track cuboid pose;
- the failure is in the upstream NRE / SensorsimService dynamic LiDAR rendering path, not in the ClosedLoopBench evaluator.

## 1. Freeze the test boundary first

A low score is not diagnostic if the input, ground truth, model, and scorer are changing together. M8 froze the following contract:

| Fixed item | Concrete contract |
| --- | --- |
| Scenario | One Scenario IR and one Ego reference trajectory |
| Time | One frame clock and one 39-frame scored window |
| Ground truth | One actor manifest with 68 dynamic actors |
| Algorithm | One TransFuser++ runtime, preprocessing path, and bbox scorer |
| Evaluation | Same-frame, same-class unique matching, oriented BEV IoU, AP25/AP50 |
| Evidence | Source-frame bindings, payload hashes, latency, fallback/mismatch counters |

Only the sensor route, modality, LiDAR transform, RGB materialization, and dynamic actor pose request were allowed to vary.

<div class="project-flow" role="img" aria-label="M8 controlled debugging flow">
  <div class="project-flow-step"><span>01</span><strong>Reference</strong><small>CARLA native RGB/LiDAR</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Normalize</strong><small>schema, hashes, axis, height</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Cross-input</strong><small>swap RGB or LiDAR only</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Live probe</strong><small>edit actor pose and observe</small></div>
</div>

## 2. The first symptom: reconstructed detection collapsed

CARLA native RGB/LiDAR established the reference. The same Scenario IR and frame contract were then bound to reconstructed and Harmonizer routes. All three routes ran real inference and produced formal reports:

| Route | RGB | LiDAR | Result |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches, vehicle AP50 `0.547`, mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches, mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | Same NuRec LiDAR | 23 predictions / 1 match, mAP50 `0.0016` |

The reconstructed route did not fail because of frame mismatch, fallback, or report validation. It completed inference on all scored frames. The failure happened after the sensor input reached the fusion model, which made causal input attribution possible.

## 3. Round one: remove execution and contract confounders

Before interpreting the score, several issues that could manufacture a model failure were fixed:

- a custom report schema was replaced with the shared `open_loop_multimodal_report.v1` contract;
- raw payload paths were remapped with the run-specific capture prefix;
- formal routes received unique run identities instead of reusing intermediate directories;
- three same-process CUDA/model warm-up passes removed first-frame timeout noise from the scored window;
- stale reconstructed/Harmonizer bindings were rebuilt with current payload, source-frame, and dynamic-object hashes;
- the legacy center-point proxy was replaced by the shared actor manifest, GT dimensions/yaw, oriented BEV IoU, and unique same-frame matching.

The purpose of this round was not to improve the score. It was to make a low score interpretable. The final routes reached 39/39 frames, zero fallback, and zero frame mismatch, so the remaining collapse was not a dropped-frame artifact.

## 4. Round two: fix the LiDAR axis matrix

The first reconstructed LiDAR `response_to_sensor` matrix mapped the render vertical axis onto the Ego forward axis. NN registration against CARLA native point clouds measured only 1.67% `<1 m` overlap with the old matrix, compared with more than 24.5% for the corrected candidate.

The naive axis swap was rejected because its determinant was `-1`, violating the NuRec rotation contract. The retained correction is a determinant `+1` pure `+90° z` rotation:

```text
[ 0 -1  0  0 ]
[ 1  0  0  0 ]
[ 0  0  1  0 ]
[ 0  0  0  1 ]
```

This was a real fix: reconstructed predictions increased from 4 to 19, and one prediction reached IoU 0.52. But r3 still produced only one match. Per-frame point-cloud overlap remained 8-37%, and no rigid rotation or mirror scan recovered native LiDAR geometry. The axis matrix was wrong, but it was not the final root cause.

## 5. Round three: compensate sensor height

Paired scans showed the NuRec cloud about 1.02 m higher than the CARLA cloud, with 0.11 m standard deviation. A `-1.0 m` z compensation was added.

The compensation was also real: `<1 m` 3D overlap rose from roughly 25-47% to 62-75%. Detection still did not recover:

- reconstructed r4: 35 predictions / 0 matches;
- harmonized r4: 23 predictions / 1 match, mAP50 `0.0016`.

The vehicle-height band in NuRec was denser with guardrails and static structures, while target vehicles had too few points. TF++ boxes followed static geometry and drifted 5-20 m. Coordinate compensation improved sensor alignment but did not restore dynamic-object support.

## 6. Round four: remove RGB resize as a confounder

The r4 NuRec RGB path had upsampled an 800x450 image to the formal 1600x900 canvas before adapter preprocessing. A new r5 path kept native 800x450 input, used one 800x450 -> 1024x512 camera adaptation, and restored vehicle-patch sharpness from roughly 14 to 192.

Detection still did not recover. The r4/r5 LiDAR payloads were byte-identical, BEV vehicle pixels were nearly unchanged, and prediction counts stayed flat. RGB sharpness had been a real quality issue, but it was not the cause of the fusion collapse.

## 7. Round five: cross-input A/B

The remaining alternative was that NuRec RGB was out of distribution for TF++. The decisive test kept the same frame, model, scorer, and GT, and swapped only one modality:

| A/B route | RGB | LiDAR | Result |
| --- | --- | --- | --- |
| `mix-a` | NuRec RGB | raw CARLA LiDAR | 37 predictions / 21 matches, vehicle AP50 `0.259`, mAP50 `0.130` |
| `mix-b` | raw CARLA RGB | NuRec LiDAR | 54 predictions / 0 matches, vehicle AP50 `0.0`, mAP50 `0.0` |

`mix-a` proves that the real model can detect on NuRec RGB when LiDAR is valid. `mix-b` uses the exact RGB that succeeds on the raw route, yet still collapses with NuRec LiDAR. The RGB distribution hypothesis is therefore falsified; reconstructed LiDAR is the only changed variable that explains the result.

## 8. Round six: independent image-only sanity check

To avoid the objection that TF++ might hide an RGB problem behind its fusion architecture, an independent image-only check ran on the same 39 frames:

- COCO-pretrained YOLOv8n, with no fine-tuning;
- reconstructed RGB produced detections on 39/39 frames;
- mean confidence was about 0.53, comparable to raw CARLA images;
- the lead vehicle matched in 38/38 visible frames.

YOLO is not a replacement for TF++. It is a control experiment for RGB visibility. The result supports the same conclusion: reconstructed RGB contains usable vehicle evidence, while the fusion collapse is LiDAR-side.

## 9. Scale up the test

A single visual frame can be misleading, so the final claim was not based on frame 18 alone:

- 39 scored frames;
- 3 sensor routes;
- 68 dynamic actors, including vehicles and pedestrians;
- one shared actor manifest;
- 39/39 intermediate traces;
- zero fallback and zero frame mismatch;
- formal oriented BEV bbox evaluation;
- an earlier three-seed M7 acceptance on the same open-loop contract.

This turns “one LiDAR frame looks wrong” into a repeated route-level failure under one model and one ground-truth contract.

## 10. The live probe: test editability itself

The last step changed the question from “is reconstructed LiDAR noisy?” to “does an actor edit actually move LiDAR returns?” The live NRE dynamic-LiDAR service was tested with:

1. all controllable actors;
2. an empty dynamic-object list;
3. target-only;
4. all-minus-target;
5. the target pose shifted by `+5/+3/0 m`.

The observations were consistent:

- the target contributed almost no returns near its true track pose;
- an isolated vehicle produced roughly 110-140 scattered points whose mean was about 12 m forward;
- changing the track pose changed only a few distant fixed-direction cells in LiDAR;
- the same pose edit changed the true target pixels in RGB;
- LiDAR extras matched checkpoint `canonical_pos + lidar_extra_signal`, rather than the per-track cuboid pose;
- the stored offsets reached roughly 45 m.

This is the final root-cause boundary: the dynamic LiDAR rendering path does not correctly apply each track's cuboid pose. It cannot currently support reliable actor edits, so it is not ready to feed a closed-loop editable simulation.

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/closed-loop-bench/raw-frame-018.jpg" alt="M8 raw CARLA frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>CARLA native reference at the shared replay index.</figcaption>
  </figure>
  <figure>
    <img src="/projects/closed-loop-bench/reconstructed-frame-018.jpg" alt="M8 reconstructed NuRec frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>NuRec observation at the same replay index: RGB remains visible, but LiDAR is not dynamically editable.</figcaption>
  </figure>
</div>

## 11. Claim boundary

We can claim:

- the CARLA / ROS2 open-loop test path is complete;
- real TransFuser++ inference is integrated with traceable reports;
- M8 provides a three-route, 39-frame, 68-actor scale-up comparison;
- controlled variables, cross-input A/B, and live probes locate the dynamic LiDAR editability failure upstream.

We cannot claim:

- model control changes the next Ego pose;
- reactive actors respond in a formal CARLA closed-loop run;
- reconstructed LiDAR is perception-ready;
- the M8 route comparison is a closed-loop score.

The project page keeps only this conclusion and a few headline numbers. The full failure sequence is preserved here and in [`open_loop_m8_debug_log.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/open_loop_m8_debug_log.md).
