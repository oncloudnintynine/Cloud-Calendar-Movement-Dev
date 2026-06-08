# CloudCalendarMovement-Dev
# https://oncloudnintynine.github.io/Cloud-Calendar-Movement-Dev/

Here is a comprehensive, step-by-step documentation guide designed specifically for your `README.md`. It covers everything from the initial scratch setup to CI/CD pipeline configuration, and long-term maintenance protocols.

***

# ☁️ Cloudy - Setup & Developer Guide

Cloudy is a serverless, Progressive Web App (PWA) built to manage company personnel, leave/event records, and Key Appointment Holder (KAH) constraints. It utilizes a static front-end hosted on GitHub Pages, communicating with a backend powered entirely by Google Apps Script (GAS) and Google Workspace APIs (Drive, Sheets, Contacts, Calendar, Gmail).

---

## 🏗️ Architecture Overview
*   **Frontend**: HTML5, TailwindCSS (CDN), Vanilla JavaScript. Hosted statically via GitHub Pages across 3 environments.
*   **Backend**: Google Apps Script (GAS). Acts as a serverless REST API processing GET/POST requests.
*   **Database**: Google Sheets (Leave/Event records), Google Contacts (User Directory & Organizational Structure), Google Calendar (Event Visualizations).
*   **Environments**: 3 fully separate environments (Experimental, Development, Production) managed by 3 separate GitHub repos.
*   **CI/CD**: GitHub Actions using Google Clasp to auto-deploy backend changes.

---

## 🚀 Step 1: Backend Setup (Google Apps Script)

1. **Create the Script Project:**
* Go to [script.google.com](https://script.google.com/) and create a **New Project**.
* Name it `Cloud Moves Backend`.
2. **Enable Google Workspace Services:**
* On the left sidebar, click on **Services** (the `+` icon).
* Find and add the **People API**. 
3. **Import Backend Code:**
* Create files matching the exact names in the `backend/` folder of the repository (`Code.gs`, `Auth.gs`, `Calendar.gs`, `Leaves.gs`, `Settings.gs`, `Github.gs`).
* *Note: GAS uses the `.gs` extension instead of `.js`.* Copy and paste the respective contents into each file.
* Open the project settings (gear icon) and check **"Show 'appsscript.json' manifest file in editor"**. Overwrite the `appsscript.json` with the one from the repo.
4. **Initialize the Database:**
* Open `Code.gs`.
* Select the `INITIAL_SETUP` function from the dropdown in the top toolbar and click **Run**.
* Google will prompt you to authorize the script. Click **Review Permissions**, choose your Google Account, click **Advanced**, and proceed to the script.
* *This function will automatically create a new Google Sheet named `Company_Leaves_DB` in your Google Drive and set up all default configuration properties.*
5. **Deploy the Web App:**
* Click the **Deploy** button (top right) -> **New deployment**.
* Click the gear icon next to "Select type" and choose **Web app**.
* **Description**: `Initial Deployment`
* **Execute as**: `Me` *(Crucial: This ensures the app uses your account's Drive/Contacts)*.
* **Who has access**: `Anyone` *(Crucial: Allows the frontend to communicate with it anonymously; the app handles its own auth)*.
* Click **Deploy**.
* **Copy the Web App URL** and the **Deployment ID**. Save these for later.

---

## 🖥️ Step 2: Frontend Setup

1. **Configure the API Endpoint:**
* Open `frontend/js/core/config.js` in your code editor.
* Replace the `PROD_URL`, `DEV_URL`, and `EXP_URL` with the **Web App URLs** corresponding to their respective deployments.
* Set `const ENV = 'Prod';` (or 'Dev' / 'Exp') appropriately for the environment you are configuring.
2. **Deploy the Frontend:**
* Push your code to your GitHub repository.
* Go to your repository settings -> **Pages**.
* Set the source to deploy from the `main` branch (root directory).
* Your app will now be accessible at `https://[your-username].github.io/[repo-name]/`.

---

## 🤖 Step 3: CI/CD Setup (Automated Backend Deployment)

To allow GitHub to push updates directly to Google Apps Script automatically, you must generate `clasp` (Google's CLI tool) credentials. You can do this entirely in your browser using **GitHub Codespaces** without needing to install anything locally.

1. **Generate Clasp Credentials via GitHub Codespaces:**
* On your GitHub repository page, click the green **<> Code** button, switch to the **Codespaces** tab, and click **Create codespace on main**. A browser-based VS Code environment will open.
* In the terminal at the bottom, run: `npm install -g @google/clasp`
* Next, run: `clasp login --no-localhost`
* The terminal will provide a long Google URL. Ctrl+Click (or Cmd+Click) to open it in a new tab.
* Log in with the Google Account hosting your Apps Script backend and click **Allow**.
* Copy the resulting URL, paste it back into your Codespace terminal, and hit **Enter**.
* Run: `cat ~/.clasprc.json`
* Copy the *entire* JSON output block shown in the terminal. You can now close and delete the Codespace.
2. **Retrieve Project IDs:**
* **Script ID**: Found in your GAS Project Settings (gear icon) under "IDs".
* **Deployment ID**: Found via GAS Deploy -> Manage deployments.
3. **Configure GitHub Secrets:**
* Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
* Add the following Repository Secrets:
 * `CLASP_CREDS`: Paste the JSON copied from Step 1.
 * `SCRIPT_ID`: Paste your Script ID.
 * `DEPLOYMENT_ID`: Paste your Deployment ID.
4. **How it works:**
Every time you push a change to the `backend/` folder on the `main` branch, GitHub Actions will trigger `.github/workflows/deploy.yml`, pushing the code and updating the exact same Web App URL so your frontend never breaks.

---

## ⚙️ Step 4: Initial App Configuration

1. **First Login:**
* Open your frontend URL.
* The default administrator password is `P@ssw0rd`.
* Log in to access the App.
2. **Configure Admin Settings:**
* Go to **Menu -> Admin Settings**.
* **Admin Password**: Change it immediately.
* **User Login Keyword**: Set the keyword users append to their phone number to log in (e.g., `peace`).
* **Organisational Structure**: Build your unit hierarchy. 
* **Register Users**: Register your first batch of users. Google Contacts syncing takes ~1 minute to reflect.

---

## 🛠️ Long-Term Maintenance & Enhancement Guide

### 1. Modifying the Frontend (UI/UX)
* The frontend relies heavily on **TailwindCSS**. You can modify the UI by adding Tailwind classes directly into the HTML strings found in `frontend/js/ui/ui.js` and `frontend/js/features/*.js`.
* **Cache Busting**: Because the app is a PWA, browsers cache the Javascript files. When you push an update to the frontend, go to `index.html` and increment the version numbers at the bottom of the file (e.g., change `?v=59` to `?v=60`). Update `sw.js` `CACHE_NAME` similarly.

### 2. Modifying the Backend (Google Apps Script)
* **Testing Locally**: The system utilizes 3 separate environments: `Exp`, `Dev`, and `Prod`. Toggle `ENV` inside `frontend/js/core/config.js` to point to the respective GAS backend URL. 
* **Database Schema Changes**: If you add new data fields to `Leaves.js`, ensure you update the `verifySchema` array in `Code.js` to automatically generate the new columns in the Google Sheet.

### 3. Fail-Safe Code Updater & Backups
* In **Admin Settings -> Code Backup**, you can trigger a 1-click backup of the latest GitHub repository code to a Google Doc in your Drive.
* If the automated CI/CD pipeline ever fails (e.g., expired Clasp credentials), you can utilize the backup Doc text with the [Fail-Safe Code Updater](https://oncloudnintynine.github.io/Fail-Safe-Code-Updater/) tool linked in the admin menu to manually patch the backend.

### 4. Handling Google Contact Sync Issues
Google Contacts is used as the directory. If a user is not appearing correctly:
1. Ensure the user's phone number exists exactly as registered.
2. If units are renamed or corrupted in Google Contacts, use the **"Force Sync G-Contacts"** button located in the **Organisational Structure** admin tab to wipe the relevant Contact data and overwrite it completely with the App's state.

### 5. Setting up Google Cloud Platform (GCP) for External Contacts Sync (OAuth)
To allow pushing contacts to external accounts, you must set up an OAuth Client in GCP:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Enable the **Google People API** under APIs & Services.
3. Configure the **OAuth consent screen** (External).
4. **CRITICAL STEP:** While your consent screen is in "Testing" mode, you MUST manually add the Google accounts you intend to link into the **Test users** list. If you skip this, you will encounter an *"Access blocked: App has not completed the Google verification process"* error when attempting to authenticate.
5. Go to Credentials -> Create Credentials -> **OAuth client ID** (Web application).
   - Add `https://script.google.com` to Authorized JavaScript origins.
   - Add your Apps Script Web App URL to Authorized redirect URIs.
6. Copy the resulting **Client ID** and **Client Secret** into the Cloudy Admin Settings panel.