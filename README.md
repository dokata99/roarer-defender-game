# Roarer Defense

A browser-based tower defense game with a cyber/digital theme. Defend the server from waves of internet threats.

Built with **Phaser 3 + Vite + TypeScript**. Deploys statically to Vercel.

## Development

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:5173 with HMR.

## Build

```bash
npm run build
```

Type-checks (`tsc --noEmit`) and produces the static bundle in `dist/`.

## Deploy (Vercel)

Option A — CLI:

```bash
npm i -g vercel
vercel deploy          # preview
vercel deploy --prod   # production
```

Option B — Git integration: push to the branch connected to your Vercel project.

## Project Structure

```
src/
  main.ts              Phaser Game bootstrap
  config/constants.ts  Canvas/grid dimensions, colors, scene keys
  systems/             Headless game systems (GridManager, ...)
  scenes/              Phaser scenes
  ui/                  UI view components (HUD, BottomBar, ...)
specs/
  01-game-design/      Game design documents
  02-visual-design/    Visual design references
  03-implementation/   Slice-by-slice implementation specs & plans
```

## Specs

- Game spec: [specs/01-game-design/01-01-game-spec.md](specs/01-game-design/01-01-game-spec.md)
- Slice 1 Foundation design: [specs/03-implementation/03-01-slice-1-foundation-design.md](specs/03-implementation/03-01-slice-1-foundation-design.md)
- Slice 1 Foundation plan: [specs/03-implementation/03-02-slice-1-foundation-plan.md](specs/03-implementation/03-02-slice-1-foundation-plan.md)
