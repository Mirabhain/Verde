# VerdeAI — fixed multi-page competition prototype

## Run
Open the folder in VS Code. Use the Live Server extension on `index.html`, or run `python -m http.server 5500` in this folder and visit http://localhost:5500/. Do not use file:// for JavaScript modules.

## Navigation
index.html → login.html → dashboard.html. Sidebar links navigate to farm.html, rotation.html, soil.html, weather.html, calendar.html. Every page has its own HTML and JS module.

## NASA API — EXACT FILE TO EDIT
`js/nasa-api.js`: NASA_POWER_BASE_URL and NASA_PARAMETERS near the top. The fetchNasaPower() function sends coordinates from My Farm. NASA POWER daily point public API does not require an API key. Click Fetch NASA observations in Weather Analysis. Requires internet and the NASA service to be reachable. No fallback or fabricated data.

## Data
`data/crops.js` is used by the website; `data/crops.csv` is a human-editable companion, not dynamically loaded. If you edit CSV, update crops.js as well. Crop data is preliminary and must be validated.

## Authentication limitations
Sign up / Log in is a visual demo, not real authentication. The email and display name are saved locally; passwords are not saved. Do not enter real passwords. Add a secure backend before production.

## Key files
- css/style.css: all styles
- js/common.js: shared menu state
- js/auth.js: demo sign in then redirect to dashboard
- js/pages/*.js: logic for each page
- js/storage.js: farm and calendar browser storage
- js/rotation.js: rule-based scoring
- js/chart.js: canvas chart
- js/nasa-api.js: NASA endpoint and fetch

## Important
NASA POWER provides historical gridded meteorological estimates, not laboratory soil nutrients or live on-farm measurements. Crop scores are heuristic and not validated probabilities. SMAP, GPM, MODIS and Landsat are not integrated.
