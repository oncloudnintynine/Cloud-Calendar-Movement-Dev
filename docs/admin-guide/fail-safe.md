# Fail-Safe Updater

The Fail-Safe Code Updater provides a manual recovery path when the automated CI/CD pipeline fails (e.g., expired Clasp credentials, GitHub Actions outage).

## Access

The Fail-Safe Updater is available at:
[https://oncloudnintynine.github.io/Fail-Safe-Code-Updater/](https://oncloudnintynine.github.io/Fail-Safe-Code-Updater/)

It's also linked from the Cloudy admin menu.

## When to Use

Use the Fail-Safe Updater when:
- GitHub Actions deployment fails and you need to apply a critical fix immediately.
- Clasp credentials have expired and you haven't regenerated them yet.
- You need to manually patch a single file without a full deployment.

## How to Use

1. **Prepare the Code**: Either:
   - Copy the code from a backup Google Doc (see [Backup & Restore](backup-restore.md)).
   - Copy the latest code directly from the GitHub repository.
2. **Open the Fail-Safe Updater**: Navigate to the tool URL.
3. **Authenticate**: Log in with the Google Account hosting your GAS backend.
4. **Paste Code**: Paste the file contents into the editor.
5. **Select Target**: Choose which GAS file to overwrite.
6. **Apply**: The tool pushes code directly to your Apps Script project.
7. **Redeploy**: Manually redeploy the Web App from the GAS editor if needed.

## Contacts Sync

### VCF Method (1-Click Phone Sync)

Cloudy avoids complex Google Cloud Platform OAuth workflows for pushing contacts. Instead:

1. In the app menu, click **"Save Contacts"**.
2. A `.vcf` (vCard) file is instantly generated and downloaded.
3. iOS/Android natively interprets this file and prompts the user to add/update the entire company directory into their phone's address book.

This keeps phone contacts in sync with the app's directory without any backend infrastructure.

### Force Sync G-Contacts

If Google Contacts become corrupted or out of sync with the app:

1. Navigate to **Admin Settings -> Org Structure**.
2. Click **"Force Sync G-Contacts"**.
3. This wipes the relevant Google Contact data and overwrites it completely with the app's current state.
4. All users are recreated in Google Contacts with correct names, phone numbers, and group memberships.

### Troubleshooting Contact Issues

If a user is not appearing correctly:

1. Ensure the user's phone number exists exactly as registered in the app.
2. Check that the Google Contact has been created (search in Google Contacts web UI).
3. Verify the contact is in the correct Contact Group.
4. Wait ~1 minute for Google's sync to propagate (the app invalidates cache on changes).
5. If still broken, use **"Force Sync G-Contacts"** to rebuild from scratch.
