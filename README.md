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
- GitHub Pages workflow configured for `https://shadejoryan.github.io/`

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

1. Create or open the GitHub repository named exactly `shadejoryan.github.io`.
2. Copy the contents of this project into the repository root, including `.github/workflows/deploy.yml`.
3. Commit and push the project to the repository's `main` branch.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to complete.
7. Visit `https://shadejoryan.github.io/`.

The Vite base path is fixed to `/` because this is a user Pages site. The included `.nojekyll` file is copied into the build output so GitHub serves the generated files unchanged.

### Manual Pages build

If another deployment system publishes `dist/`, create the production files with:

```bash
npm install
npm run build
```

Publish the **contents** of `dist/` at the site root. Do not place the `dist` folder itself one level below the root.

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
