# Troubleshooting

Common issues and their solutions.

## Login Issues

### Cannot log in as admin
- Verify you're using the correct password (default: `P@ssw0rd`).
- Check GAS execution logs for errors in the login handler.
- If password was changed and forgotten, reset it by editing Script Properties in the GAS editor (Project Settings → Script Properties → `adminPassword`).

### User cannot log in
- Ensure the user is registered in **Admin Settings -> Users Management**.
- Verify the phone number matches exactly (8 digits, no spaces).
- Confirm the user knows the correct keyword suffix (configured in General Settings).
- Check that the Google Contact has been created (search in Google Contacts web UI).
- Wait ~1 minute after registration for Google's contact sync to propagate.
- Verify the People API is enabled in the GAS project (Services → People API).

### "Login failed" with no error
- Check the browser console (F12) for network errors.
- Verify the GAS Web App URL in `config.js` is correct.
- Ensure the GAS deployment is active (Deploy → Manage deployments).

## Submission Issues

### Form submission fails
- Check the sync pill status — if red, you're offline. Wait for connectivity.
- Verify the GAS deployment is active and the Web App URL hasn't changed.
- Check GAS execution logs for errors in `submitLeave()`.
- Ensure the Google Sheet `Company_Leaves_DB` exists and hasn't been deleted or renamed.

### Google Calendar event not created
- Verify the Calendar API is enabled in the GAS project (it's built-in, but confirm under Services).
- Check GAS execution logs for Calendar API errors.
- Ensure the service account has write access to the target calendar.
- If the department calendar doesn't exist, the system auto-creates it — verify the GAS account has calendar creation permissions.

### KAH alerts not sending
- Verify **Approving Authority Email** is configured in KAH Management.
- Check GAS execution logs for MailApp errors.
- Confirm the KAH limit percentage is set correctly.
- Verify the event type has **KAH Tracker** enabled.

## Deployment Issues

### GitHub Actions deployment failing
- Check the Actions tab for error logs.
- Common causes:
  - **Expired Clasp credentials**: Regenerate via Codespaces (`clasp login --no-localhost`) and update `CLASP_CREDS` secret.
  - **Wrong Script ID or Deployment ID**: Verify in GAS Project Settings and Deploy → Manage deployments.
  - **Network timeout**: Retry the workflow.
- If CI/CD is broken and you need to deploy urgently, use the [Fail-Safe Updater](admin-guide/fail-safe.md).

### Frontend not updating after deploy
- The PWA service worker caches assets. Perform cache busting:
  1. Increment version query strings in `index.html` (`?v=X` to `?v=X+1`).
  2. Update `CACHE_NAME` in `sw.js` to match.
  3. Hard-refresh the app (Ctrl+Shift+R).
- See [UI Features - Cache Busting](ui-features.md#cache-busting-pwa-updates) for details.

### Wrong environment showing
- The environment is set by `const ENV` in `backend/config.js`.
- Non-production environments show a colored banner (DEV = red, EXP = purple).
- If you're seeing the wrong banner, verify `ENV` is set correctly and the corresponding URL is correct.

## Data Issues

### Missing data in Google Sheet
- Verify the sheet `Company_Leaves_DB` exists in Google Drive.
- Check that columns haven't been manually deleted — `verifySchema()` auto-adds missing columns on the next API call.
- Look at GAS execution logs for Sheets API errors.

### Duplicate records
- This can happen if a submission was retried after a partial failure.
- Manually clean up duplicates in the Google Sheet.
- Check GAS execution logs for timeout errors that might cause partial writes.

### Contact sync issues
- See [Fail-Safe Updater](admin-guide/fail-safe.md) for the VCF method and Force Sync instructions.
- Google Contacts has a propagation delay of ~1 minute — wait before troubleshooting.
- If contacts are corrupted, use **"Force Sync G-Contacts"** to rebuild.

## Performance Issues

### App is slow to load
- First load may be slower as the PWA caches assets. Subsequent loads should be fast.
- Large datasets in the dashboard may cause rendering delays — use department filters to reduce visible entries.
- Check browser DevTools → Network tab for slow API responses.

### Sync pill stuck on "syncing"
- A sync operation may have timed out. Refresh the page (F5).
- If the issue persists, clear `localStorage` (this resets the sync queue — pending submissions will be lost).
- Check GAS execution logs for timeout errors (GAS has a 6-minute execution limit).

## Getting Help

When reporting issues, include:
1. Environment (Dev, Exp, or Prod).
2. Steps to reproduce.
3. Browser console logs (F12 → Console).
4. Approximate time of the issue (to cross-reference with GAS execution logs).
5. Screenshots of any error messages.
