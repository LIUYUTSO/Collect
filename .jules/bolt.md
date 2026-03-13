## 2024-03-13 - Nominatim API Rate Limits
**Learning:** The Nominatim OpenStreetMap API is used for location search, but it has a strict rate limit of 1 request per second. Triggering it on every keystroke causes `429 Too Many Requests` errors and can block the user's IP.
**Action:** Always debounce the `handleLocationSearch` function in `app/dashboard/page.tsx` (and any other usage of Nominatim) by at least 500ms to respect the rate limit, prevent excessive API calls, and avoid blocking the application from location searches.
