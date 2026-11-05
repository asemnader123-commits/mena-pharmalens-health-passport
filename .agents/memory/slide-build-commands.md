---
name: Artifact builds
description: Manual build requirements for the workspace Vite artifact setup.
---

Manual production builds for workspace Vite artifacts must provide both `PORT` and `BASE_PATH`; the managed workflow injects these automatically.

**Why:** The Vite configuration intentionally fails early when either value is missing, so a plain package build command reports a misleading environment error before compiling.

**How to apply:** When building outside the managed workflow, set `PORT` to the artifact service port and `BASE_PATH` to the artifact preview path, including its trailing slash.