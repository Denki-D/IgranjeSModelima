# Agent guide

## Project

This is a small, dependency-free static web app. `index.html` defines the UI, `styles.css` its responsive dark theme, and `app.js` the sample files, editor behavior, persistence, and activity history.

## Run

Open `index.html` directly in a modern browser. No build or install step is needed.

## Quality check

Run `npm test` with Node.js 18 or newer. GitHub Actions runs the same check on pushes and pull requests; no package installation is required.

Dependabot checks GitHub Actions versions weekly; its configuration is in `.github/dependabot.yml`.

## App behavior

Sample workspace files are defined in `seedFiles` in `app.js`. User edits and history are stored in the browser's `localStorage` under `model-playground-v1`; they are not written to project files or synchronized between browsers.

Agent attribution is selected manually in the UI when saving. Do not imply or add automatic agent detection. Preserve the local-only storage and explicit attribution behavior unless specifically asked to change it.
