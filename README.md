# VerdeAI – Prototype Setup Guide

## 1. Project Overview

VerdeAI is a web-based agricultural assistant prototype designed to help users manage farm information, monitor weather conditions, and explore agricultural recommendations.

This prototype prioritises demonstrating the main features and user experience rather than implementing a complete production system.

## 2. Requirements

Install the following before running the project:

- Node.js and npm
- Git
- Visual Studio Code (recommended)
- Internet connection for external API requests

## 3. Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate into the project directory:

```bash
cd VerdeAI
```

Install dependencies:

```bash
npm install
```

Create a `.env` file if required by the backend.

Example:

```env
PORT=3000
GROQ_API_KEY=your_api_key
```

Do not upload `.env` or API keys to GitHub.

## 4. Running the Project

Start the application:

```bash
npm run start
```

Open the application in your browser:

```text
http://localhost:3000
```

## 5. Prototype Data Storage

The prototype uses browser LocalStorage for basic user and farm information.

| Feature | Storage |
|---|---|
| Demo authentication | LocalStorage |
| Farm profile | LocalStorage |
| Farm calendar/tasks | LocalStorage |
| Temporary API cache | SessionStorage |
| AI responses | API integration |

**Important:**
- Data is stored locally in the current browser.
- Clearing browser storage may remove saved prototype data.
- Data does not automatically synchronise between devices.
- Demo authentication is not secure and must not be used for real accounts.

## 6. API Integration

External API requests are handled through the Express backend.

| API | Purpose |
|---|---|
| Groq API | AI-powered agricultural assistance |
| NASA POWER API | Historical and agricultural weather data |
| Weather forecast API | Weather forecast information |

The frontend communicates with the backend through endpoints such as:

```text
/api/nasa/daily
/api/nasa/climate
/api/forecast
```

The Express API routes are registered through:

```js
app.use("/api", apiRoutes);
```

New API endpoints should be added to the existing `routes/api.js` file to maintain the current project structure.

Do not create unnecessary additional route files for this prototype.

## 7. Development Guidelines

To keep the prototype manageable:

1. Preserve the existing folder structure.
2. Reuse existing JavaScript modules and API functions.
3. Avoid unnecessary database dependencies.
4. Use LocalStorage for farm and task persistence.
5. Keep external API requests in the backend where appropriate.
6. Do not expose private API keys in frontend JavaScript.
7. Avoid changing existing UI components unless required.
8. Test each feature after making changes.

## 8. Troubleshooting

| Problem | Possible Solution |
|---|---|
| `404 Not Found` | Check whether the requested Express endpoint exists and is registered. |
| `Cannot GET /api/...` | Verify the route path in `routes/api.js`. |
| NASA API failure | Check internet connectivity, coordinates and NASA API response. |
| Forecast API failure | Check the configured forecast provider and endpoint. |
| `ERR_ABORTED 404` for JavaScript | Verify the script path and file location inside `public/`. |
| Chart.js cannot acquire context | Check whether the required canvas element exists and its ID matches. |
| Cannot set `innerHTML` of null | Verify that the referenced HTML element exists. |
| LocalStorage data missing | Check browser storage and the correct storage key. |

## 9. Prototype Limitations

- Authentication is simulated for demonstration.
- Farm information and tasks are browser-specific.
- External API availability depends on internet connectivity and provider availability.
- Weather and agricultural recommendations are intended for demonstration and learning purposes.
- The prototype is not intended for production deployment.

---

**Project:** VerdeAI  
**Purpose:** Agricultural management and AI assistant prototype  
**Environment:** Node.js, Express.js, HTML, CSS and JavaScript
