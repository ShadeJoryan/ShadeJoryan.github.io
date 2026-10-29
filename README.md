# Shade Lab — character input

A responsive, local-first React + TypeScript + Vite page for recording MapleStory Shade character stats. It is structured for a future damage simulator while remaining useful today as a versioned profile manager.

## Features

- Organized identity, base, percentage, offense, target, progression, and scenario sections
- Inline validation plus a page-level validation summary
- Multiple named profiles saved in browser `localStorage`
- Save, save-as-new, load, delete, and non-destructive editor reset
- JSON import for a profile, a profile library, or a legacy direct character object
- JSON export for the current editor profile or the full saved library
- Versioned character and library schemas (`schemaVersion: 1`)
- Responsive, accessible dark UI
- Validated placeholder **Run Simulation** action
- GitHub Pages workflow with repository-aware Vite base paths

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Production checks

```bash
npm run typecheck
npm run build
npm run preview
```

The static production output is written to `dist/`.

## Deploy to GitHub Pages

1. Create a GitHub repository and copy this project into it.
2. Run `npm install`. You may commit the generated `package-lock.json` for reproducible installs.
3. Push the project to the repository's `main` branch.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to complete.
7. Visit `https://<owner>.github.io/<repository-name>/`.

The workflow sets `VITE_BASE_PATH` to `/<repository-name>/`, so JS and CSS assets work from a project Pages URL. For a user/organization Pages repository named `<owner>.github.io`, change the workflow build environment to:

```yaml
env:
  VITE_BASE_PATH: /
```

### Manual Pages build

If another deployment system publishes `dist/`, build with the correct base path:

```bash
VITE_BASE_PATH=/your-repository-name/ npm run build
```

## Data and privacy

Saved profiles remain in the current browser and origin under the key `shade-lab.profile-library.v1`. Clearing site data removes them. Use **Export profile library** for backups or migration to another browser.

Imports are normalized against the current schema. Unknown properties are ignored, missing known properties receive defaults, and malformed JSON is rejected with a visible message.

## Connecting the simulator

`runSimulation` in `src/App.tsx` is the integration point. It already blocks invalid data. Replace its informational notice with a call into a calculation module; keep the input contract as `CharacterDataV1` or add an explicit schema migration when the model changes.

## Project structure

```text
src/
  components/       Reusable fields and profile sidebar
  App.tsx           Page orchestration and profile actions
  defaults.ts       New-profile defaults
  model.ts          Validation, normalization, import/export, versioning
  storage.ts        localStorage persistence boundary
  styles.css        Responsive visual system
  types.ts          Versioned TypeScript data contracts
.github/workflows/  GitHub Pages deployment
```
