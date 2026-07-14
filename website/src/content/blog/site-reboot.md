---
title: "Rebuilding this site as an engineering notebook"
description: "Why the old portfolio was retired, how the new information architecture works, and what will be published next."
publishedAt: 2026-07-14
category: engineering-notes
tags:
  - Astro
  - Publishing
  - Systems Thinking
featured: true
draft: false
---

The previous version of this site tried to explain too much on one page. It mixed a résumé, a system diagram, and project summaries without giving any of them enough room. The content also aged faster than the structure could support.

This version starts again with a simpler contract: **write durable engineering notes, document selected systems, and keep small updates separate.**

## Three different kinds of content

The site now has three publishing surfaces:

1. **Blog** for ideas that need context, reasoning, and examples.
2. **Work** for case studies organized around a problem, role, architecture, trade-offs, and evidence.
3. **News** for short updates that should not become articles.

Blog posts use one stable category and a small set of technical tags. Categories describe the long-lived subject; tags capture technologies, datasets, standards, or methods.

## What I plan to write about

The working scope is deliberately narrow:

- simulation systems and replay workflows;
- system-level evaluation and regression evidence;
- scenario mining and long-tail data workflows;
- data infrastructure that connects those pieces;
- engineering decisions that are easy to lose once a system is running.

## What changed technically

The site is statically generated with Astro. Content lives in typed Markdown collections, search is produced at build time, and the public pages require almost no client-side JavaScript. Fonts and assets are local so the first render does not depend on third-party CDNs.

The old material remains recoverable in Git history, but it is no longer published by default. New case studies will return only after their claims, diagrams, and metrics have been reviewed.
