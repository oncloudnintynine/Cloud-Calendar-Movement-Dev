# Backup & Restore

## Code Backup

The app can back up the latest GitHub repository code to a Google Doc in your Drive.

### Creating a Backup

1. Navigate to **Admin Settings -> Code Backup** (Fail-Safe Updater tab).
2. Click **Backup Code to Google Doc**.
3. A Google Doc is created in your Drive containing the full repository source code.
4. Save the Doc URL for future reference.

### When to Back Up

- Before making significant configuration changes.
- After each major release.
- As a safety net if CI/CD pipeline credentials expire.

## Restore from Backup

If you need to restore code from a backup:

1. Use the **Fail-Safe Code Updater** tool (linked in the admin menu).
2. Copy code from the backup Google Doc.
3. Paste into the Fail-Safe tool to manually patch the GAS backend.

See [Fail-Safe Updater](fail-safe.md) for detailed instructions.

## Database Backup

The primary database is the `Company_Leaves_DB` Google Sheet in your Drive. Google Sheets maintains its own version history.

### Manual Backup

1. Open `Company_Leaves_DB` in Google Sheets.
2. Go to **File -> Make a copy** to create a dated backup.
3. For additional safety, export as Excel/CSV via **File -> Download**.

### Google Sheets Version History

Google Sheets automatically tracks changes. To restore a previous version:
1. Open the sheet.
2. Go to **File -> Version history -> See version history**.
3. Select a previous version and click **Restore this version**.

## Data Migration

### Backend Schema Updates

When adding new data fields to `Leaves.js`, update the `verifySchema` array in `Code.js`. This ensures new columns are automatically added to the Google Sheet on the next API call — no manual migration needed.

### Duty Planner Migration

The duty planner stores data in separate sheets within `Company_Leaves_DB`. To reset or migrate DP data:

1. Open the GAS editor.
2. Select `Code.js`.
3. Run the `dpRunMigration()` function.
4. This reinitializes the duty planner sheets while preserving the configuration structure.

### Initializing a Fresh Database

If you need to start with a clean slate:

1. Delete or archive the existing `Company_Leaves_DB` spreadsheet.
2. Run `INITIAL_SETUP()` from the GAS editor to create a fresh database.
3. Run `dpSetupDatabase()` to initialize duty planner schema.
4. Re-register all users and reconfigure event types and KAH groups.
