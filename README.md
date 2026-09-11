# Yggra

**The Agent Evolution Atlas** — an English research atlas of self-improving agents, designed for people and agents to explore the same evidence.

Yggra organizes methods around three questions:

1. Can capabilities be inherited?
2. Can lineage improve search?
3. Do descendants become better improvers?

The current seed collection contains eight papers. Version inheritance is explored within the harness improvement branch.

## Explore

| Resource | Purpose |
| --- | --- |
| [`dist/index.html`](dist/index.html) | Animated world-tree landing page, with pause and reduced-motion support |
| [`dist/atlas.html`](dist/atlas.html) | Interactive taxonomy, paper search, and evidence matrix |
| [`dist/catalog.html`](dist/catalog.html) | Complete readable catalog; no JavaScript required |
| [`dist/atlas.json`](dist/atlas.json) | Structured papers, taxonomy, evidence notes, and sources |
| [`dist/atlas.schema.json`](dist/atlas.schema.json) | JSON Schema for the dataset |
| [`dist/agent-guide.html`](dist/agent-guide.html) | URL parameters, semantic controls, and interpretation rules |
| [`dist/llms.txt`](dist/llms.txt) | Compact resource discovery guide |

The atlas supports stable identifiers, direct links, and browser Back/Forward navigation. For example:

```text
/atlas.html?view=questions&paper=hyperagents&question=q3
```

## Run locally

The site uses static HTML, CSS, and JavaScript. No dependency installation is required.

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open [http://localhost:8000](http://localhost:8000). The landing page uses Google Fonts with local system-font fallbacks.

## Update the data

Edit [`data/atlas.json`](data/atlas.json), then regenerate the browser dataset, JSON Schema, catalog, and agent documentation:

```sh
node scripts/build-data.cjs
```

Generated files are committed in `dist/`. Update their source dataset or generator rather than editing generated outputs directly. Landing-page content is authored separately in `dist/index.html`.

Run the URL-state and legacy-route tests with Node.js 18 or later:

```sh
node --test tests/*.test.cjs
```

## Evidence scope

This is a seed collection with editorial annotations, not a comprehensive survey or independent replication.

Classification edges describe method categories, not actual ancestry. Read every evidence label together with its scope note and source:

- **Tested:** supported within the stated experimental scope.
- **Mechanism:** a relevant mechanism exists; the research question is not fully isolated.
- **Unverified:** evidence has not been verified in this atlas.
- **Out of scope:** outside the core method's stated scope.

Question filters include `tested` and `mechanism`. Excluded papers are not negative findings.

## Hosted demo

The [hosted demo](https://agent-evolution-atlas-pan.pan5998022.chatgpt.site) is private and requires authorized access, including its JSON and agent resources. Local use of this repository does not require access to the hosted demo.

The existing Sites deployment configuration lives in [`.openai/hosting.json`](.openai/hosting.json). Any static web server can serve `dist/`.
