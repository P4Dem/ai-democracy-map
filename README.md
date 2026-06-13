# AIxD Threat Map

Filterable, searchable database of AI threats and opportunities to democracy, mapped to the IDEA Democracy Assessment Framework (P4Democracy aspect codes). Built for P4D researchers to share with policymakers.

**Staging:** [nashthecoder.github.io/ai-democracy-map-dev](https://nashthecoder.github.io/ai-democracy-map-dev/)  
**Production:** [p4dem.github.io/ai-democracy-map](https://p4dem.github.io/ai-democracy-map/)

> **All source code lives in [`aixd-threatmap-master 2/`](./aixd-threatmap-master%202/).**  
> Run all commands from inside that directory.

## Quick start

```sh
# 1. Make sure you're using Node.js >= 22.12.0
node --version    # if < 22 (or shows v20), switch via nvm:
nvm install 22    # skip if already installed
nvm use 22
nvm alias default 22   # recommended: avoid switching every session

# 2. Enter the source directory
cd "aixd-threatmap-master 2"

# 3. Install dependencies
bun install

# 4. Start dev server (with base path override for local dev)
PUBLIC_BASE_PATH=/ bun run dev
# → http://localhost:4321
```

For full setup details (Python venv, dollar-sign path fix, data pipeline), see [`aixd-threatmap-master 2/README.md`](./aixd-threatmap-master%202/README.md).
