# Changelog

- **Date:** 2026-08-27 17:31:00
  - **Description:** Secured hardcoded Carto API key by replacing it with a template literal using environment variables and creating a local .env file.
  - **Files affected:** `frontend/src/components/Map.jsx`, `frontend/.env`, `frontend/.gitignore`

- **Date:** 2026-08-27 17:42:00
  - **Description:** Restored Carto API key in `frontend/.env` and properly set Gemini API key in `backend/.env`.
  - **Files affected:** `frontend/.env`, `backend/.env`

