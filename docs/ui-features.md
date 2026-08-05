# UI Features

Non-functional UI capabilities that enhance the user experience across the entire app.

## Dark Mode

The app supports light and dark themes.

### Toggle
Use the 🌗 button in the top navigation bar to switch between light and dark modes.

### Behavior
- Preference is saved to `localStorage` and persists across sessions.
- On first visit (no saved preference), the app follows the OS-level `prefers-color-scheme` setting.
- All UI elements — forms, cards, calendars, modals — respect the active theme.

## Environment Banner

A prominent colored banner appears at the top of the screen in non-Production environments:

| Environment | Banner | Color |
|---|---|---|
| **DEV MODE** | Red | Development/staging |
| **EXP MODE** | Purple | Experimental/QA |
| **Production** | (none) | No banner shown |

The banner text is configurable via `config.js`. It ensures users and testers never confuse which environment they're working in.

## Cache Busting (PWA Updates)

Because the app is a PWA with a Service Worker, browsers aggressively cache JS/CSS files. When deploying frontend updates, you must manually bust the cache.

### Steps for Every Frontend Deploy

1. **Increment version strings** in `index.html`:
   ```html
   <!-- Before -->
   <script src="js/app.js?v=129"></script>
   <!-- After -->
   <script src="js/app.js?v=130"></script>
   ```
   Update ALL script and style tags.

2. **Update `CACHE_NAME`** in `sw.js`:
   ```js
   // Before
   const CACHE_NAME = 'cloudy-v129';
   // After
   const CACHE_NAME = 'cloudy-v130';
   ```

3. **How it works**:
   - The service worker detects the new cache name.
   - It installs all updated assets into the new cache.
   - The old cache is retained until all tabs using it are closed.
   - On next load, the new cache activates and serves updated files.

### Verification

After deploying:
1. Hard-refresh the app (Ctrl+Shift+R or Cmd+Shift+R).
2. Open DevTools → Application → Service Workers.
3. Verify the new service worker is activated and the old one is redundant.

## PWA Capabilities

### Installable
The app can be installed on desktop and mobile devices as a standalone app:
- Chrome/Edge: "Install" icon in the address bar.
- Safari (iOS): "Add to Home Screen" in the Share menu.
- The `manifest.json` defines app name, icons, theme color, and display mode.

### Offline Support
- The Service Worker caches all static assets (HTML, JS, CSS, icons) on first load.
- When offline, the app loads from cache with full navigation and form functionality.
- Submissions queue locally and sync when connectivity returns (see [Features - Offline & Background Sync](features.md#offline--background-sync)).

### Cache Strategy
- **Cache-first** for static assets (HTML, JS, CSS, icons).
- **Network-first** for API calls (always try to fetch fresh data, fall back to cached if offline).
- The service worker manages cache lifecycle automatically.
