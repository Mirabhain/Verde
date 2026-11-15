# VerdeAI — AI-Powered Agricultural Decision Support

**Live Website:** [https://verdeai-x3ls.onrender.com/](https://verdeai-x3ls.onrender.com/)

> **Be Verdant with VerdeAI.**  
> *Smarter Decisions. Greener Harvests.*

VerdeAI is a web-based agricultural assistant prototype designed to help Malaysian farmers manage farm information, explore crop rotation recommendations, monitor climate and soil conditions, and plan agricultural activities using external data services and AI-powered assistance.

This project is a **prototype for demonstration and learning**, not a production-ready farm management system. Some analyses are calculated or estimated from available inputs and should not be treated as field measurements or professional agronomic advice.

## Features and Screenshots

> **Screenshot setup:** Save your screenshots in a `screenshots/` folder at the repository root, using the filenames shown below. Replace or remove sections that are not present in your current build. Images will appear automatically on GitHub once the files are committed.

### 1. Home Page

The landing page introduces VerdeAI, its main agricultural decision-support features, and a quick overview of climate information for the selected location.

<img width="400" height="213" alt="Dashboard___VerdeAI_-_Google_Chrome_2026-11-15_21-29-27" src="https://github.com/user-attachments/assets/f42da689-81cb-46f8-bd45-5115dec7f3be" />

### 2. Farm Profile and Management

Users can enter and manage basic farm details to personalise their experience. Prototype farm information is stored in the browser.

<img width="400" height="213" alt="My_farm___VerdeAI_-_Google_Chrome_2026-11-15_21-29-47" src="https://github.com/user-attachments/assets/b32627f9-64e7-46e6-bc02-ded3d133cfaf" />

### 3. Weather and Climate Dashboard

Explore historical weather observations and summaries, including temperature, rainfall, humidity, evaporation and related agricultural indicators. Historical climate data is sourced from NASA POWER.

<img width="400" height="213" alt="Weather__Climate_Analysis___VerdeAI_-_Google_Chrome_2026-11-15_21-30-09" src="https://github.com/user-attachments/assets/251cd8ff-5beb-43ab-bb9d-ecb73e544515" />

### 4. Soil and Water Monitoring

View soil wetness, rainfall, evaporation and water-balance indicators to support farm planning. NASA POWER values represent gridded estimates, not physical sensors installed on a farm.


<img width="400" height="213" alt="Soil__Water_Analysis___VerdeAI_-_Google_Chrome_2026-11-15_21-21-14" src="https://github.com/user-attachments/assets/cdd5b07a-2c93-4cb8-af9c-3ced5a0ccfdd" />

### 5. Weather Forecast and Terrain

Review forecast conditions and terrain indicators, including elevation and estimated slope, where the external provider is available. Forecast and elevation requests use Open-Meteo in the current backend code.

![Forecast and terrain information](screenshots/forecast-terrain.png)

### 6. Crop Rotation Recommendations

Explore crop rotation suggestions to support planning based on available agricultural information. Recommendations are decision-support outputs and should be checked against local agronomic conditions.

<img width="400" height="213" alt="Crop_rotation___VerdeAI_-_Google_Chrome_2026-11-15_21-32-08" src="https://github.com/user-attachments/assets/5fc4be96-54ea-4452-ba3b-f47712366cce" />

### 7. Farm Calendar and Risk Planning

Organise farm activities and explore wet/dry periods, seasonal risks and crop-planning timelines where implemented in the current build.

<img width="400" height="213" alt="Farm_calendar___VerdeAI_-_Google_Chrome_2026-11-15_21-32-39" src="https://github.com/user-attachments/assets/135538cd-b91d-483a-a591-32f65ceeb2f4" />

### 8. AI Agricultural Assistant

Ask agriculture-related questions using the AI assistant. The backend integrates with the Groq API when a valid `GROQ_API_KEY` is configured.

<img width="400" height="213" alt="Weather__Climate_Analysis___VerdeAI_-_Google_Chrome_2026-11-15_21-30-54" src="https://github.com/user-attachments/assets/6eddb240-8229-42c0-9869-355f5b52fc53" />

### 9. Data Visualisation and Trends

View charts and timelines for available agricultural and climate data. The exact charts shown depend on the features implemented in the current version.

![Data visualisation dashboard](screenshots/data-visualisation.png)

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| AI integration | Groq API |
| Historical climate and soil indicators | NASA POWER API |
| Weather forecast and elevation | Open-Meteo API |
| Vegetation data attempt | NASA ORNL DAAC MODIS subset API |
| Prototype storage | Browser LocalStorage; SessionStorage where used |
| Deployment | Render |

## External API Integration

| Provider / endpoint | Purpose | Notes |
|---|---|---|
| NASA POWER daily point API | Historical temperature, precipitation, humidity, soil wetness, evaporation, solar radiation | No API key required |
| NASA POWER monthly point API | Monthly climate summaries and seasonal patterns | No API key required |
| Open-Meteo forecast API | Short-term temperature and rainfall forecast | Subject to provider rate limits |
| Open-Meteo elevation API | Elevation samples used for terrain and slope estimates | Subject to provider rate limits |
| NASA ORNL DAAC MODIS subset API | Attempts to retrieve NDVI/EVI observations | Availability depends on requested data |
| Groq API | AI-powered agricultural assistance | Requires a private API key |

**Data transparency:** NASA POWER provides gridded climate estimates rather than on-farm sensor measurements. Terrain slope, heat-stress categories, water-balance summaries and crop recommendations are derived by VerdeAI. The current vegetation module may use model-estimated or hardcoded fallback NDVI/EVI values if satellite retrieval fails; these must not be represented as measured satellite observations.

### Backend API endpoints

Examples of frontend-to-backend endpoints used by the prototype:

```text
/api/nasa/daily
/api/nasa/climate
/api/forecast
/api/terrain
```

The Express API routes are registered through:

```js
app.use("/api", apiRoutes);
```

Add new endpoints to the existing `routes/api.js` where appropriate to preserve the current project structure. Verify actual route names against the latest source before documenting additional endpoints.

## Requirements

Install the following before running the project:

- Node.js and npm
- Git
- Visual Studio Code (recommended)
- Internet connection for external API requests

## Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd VerdeAI
```

Replace `<repository-url>` with your actual GitHub repository URL.

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the project root if required by the backend:

```env
PORT=3000
GROQ_API_KEY=your_groq_api_key_here
```

Never commit `.env` or real API keys to GitHub. Add `.env` to `.gitignore`.

**4. Start the server**

```bash
npm run start
```

If Windows PowerShell blocks `npm.ps1`, try:

```powershell
npm.cmd install
npm.cmd run start
```

**5. Open the application**

```text
http://localhost:3000
```

## Prototype Data Storage

| Feature | Storage |
|---|---|
| Demo authentication | LocalStorage |
| Farm profile | LocalStorage |
| Farm calendar / tasks | LocalStorage |
| Temporary frontend API cache | SessionStorage, where implemented |
| Backend API response cache | In-memory cache, where implemented |
| AI responses | External API integration |

**Important:** Browser-stored data is specific to the browser and device. Clearing storage may remove saved information. It does not automatically synchronise across devices. Demo authentication is not secure enough for real user accounts.

## Deployment

The prototype is available at **[VerdeAI on Render](https://verdeai-x3ls.onrender.com/)**.

For deployment, configure required environment variables (including `GROQ_API_KEY`) in the hosting provider's environment settings. A local `.env` file is not automatically uploaded to Render. If auto-deploy is enabled, pushing changes to the branch configured in Render triggers a new deployment.

## Development Guidelines

1. Preserve the existing project structure and reuse JavaScript modules where practical.
2. Avoid unnecessary database dependencies for prototype-only features.
3. Use LocalStorage for simple farm and task persistence.
4. Keep private API keys on the backend, never in frontend JavaScript.
5. Handle missing or rate-limited external data without presenting fabricated values as observations.
6. Avoid unnecessary UI changes and test affected features after every update.
7. Keep screenshots and documentation aligned with the deployed build.

## Troubleshooting

| Problem | Suggested check |
|---|---|
| `404 Not Found` / `Cannot GET /api/...` | Verify the endpoint and its registration in `routes/api.js`. |
| NASA API failure | Check connectivity, coordinates, requested parameters and NASA response. |
| Forecast / elevation `429` | External provider may be rate-limiting requests; inspect server logs, reduce duplicate calls, use caching and respect `Retry-After`. |
| `/api/terrain` returns `502` | Check whether the upstream elevation API failed and whether the backend converts that failure into `502`. |
| Groq `401` | Verify the private Groq API key and environment configuration. |
| `ERR_ABORTED 404` for JavaScript | Check script paths under `public/`. |
| Chart.js cannot acquire context | Confirm the canvas exists and its ID matches the JavaScript selector. |
| Cannot set `innerHTML` of null | Confirm the referenced HTML element exists. |
| LocalStorage data missing | Check the browser's storage and the storage key. |

## Prototype Limitations

- Authentication is simulated for demonstration purposes.
- Farm information and tasks are browser-specific.
- External API services can be unavailable or rate-limited, especially on shared hosting networks.
- Some vegetation indicators may be estimates or fallback values rather than verified satellite observations.
- Crop rotation and weather recommendations are for learning and demonstration, not guaranteed agricultural outcomes.
- The prototype is not intended for production deployment without further security, data validation and reliability work.

---

**Project:** VerdeAI  
**Purpose:** Agricultural management and AI-powered decision-support prototype  
**Environment:** Node.js, Express.js, HTML, CSS and JavaScript  
**Live Demo:** https://verdeai-x3ls.onrender.com/
