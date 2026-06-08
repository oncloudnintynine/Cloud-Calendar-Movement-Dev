// ==========================================
// OAuth2.js - Multi-Account Authentication
// ==========================================

function saveOAuthCredentials(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var props = PropertiesService.getScriptProperties();
props.setProperty('oauthClientId', data.clientId);
props.setProperty('oauthClientSecret', data.clientSecret);
return { success: true };
}

function generateOAuthLink(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var service = getOAuthService('temp_generator');
if (!service.getClientId() || !service.getClientSecret()) {
  throw new Error("Missing GCP Credentials. Please save Client ID and Secret first.");
}
return service.getAuthorizationUrl();
}

function removeLinkedAccount(data) {
if (data._userRole !== 'admin') throw new Error("Unauthorized");
var props = PropertiesService.getScriptProperties();
var accountsStr = props.getProperty('oauthLinkedAccounts');
var accounts = accountsStr ? JSON.parse(accountsStr) : [];

var idx = accounts.indexOf(data.email);
if (idx !== -1) {
  accounts.splice(idx, 1);
  props.setProperty('oauthLinkedAccounts', JSON.stringify(accounts));
}

// Reset the specific token
var service = getOAuthService(data.email);
service.reset();

return accounts;
}

function getLinkedAccounts() {
var props = PropertiesService.getScriptProperties();
var accountsStr = props.getProperty('oauthLinkedAccounts');
return accountsStr ? JSON.parse(accountsStr) : [];
}

/**
* Dynamically generates an OAuth2 service for a specific target email account.
*/
function getOAuthService(accountEmail) {
var props = PropertiesService.getScriptProperties();
var clientId = props.getProperty('oauthClientId');
var clientSecret = props.getProperty('oauthClientSecret');

return OAuth2.createService('ContactsSync_' + accountEmail)
  .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
  .setTokenUrl('https://accounts.google.com/o/oauth2/token')
  .setClientId(clientId)
  .setClientSecret(clientSecret)
  .setCallbackFunction('authCallbackHandler')
  .setPropertyStore(PropertiesService.getScriptProperties())
  .setScope('https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/userinfo.email')
  .setParam('access_type', 'offline')
  .setParam('prompt', 'consent');
}

/**
* Handles the OAuth2 callback from Google.
* Because the target user doesn't pass their email during the initial auth click,
* we extract it from the token response, save the token under that email's specific
* service name, and add it to our master list.
*/
function authCallbackHandler(e) {
var tempService = getOAuthService('temp_generator');
var isAuthorized = tempService.handleCallback(e);

if (isAuthorized) {
  try {
      // 1. Get the authenticated user's email
      var token = tempService.getAccessToken();
      var response = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 'Authorization': 'Bearer ' + token }
      });
      var email = JSON.parse(response.getContentText()).email;
      
      if (!email) throw new Error("Could not retrieve email address from Google.");

      // 2. Transfer the token from 'temp_generator' to the specific email's service
      var userAuthService = getOAuthService(email);
      userAuthService.getToken_(); // Initialize internal state
      userAuthService.saveToken_(tempService.getToken_());
      tempService.reset(); // Clear temp

      // 3. Add to the master list of linked accounts
      var props = PropertiesService.getScriptProperties();
      var accountsStr = props.getProperty('oauthLinkedAccounts');
      var accounts = accountsStr ? JSON.parse(accountsStr) : [];
      
      if (accounts.indexOf(email) === -1) {
          accounts.push(email);
          props.setProperty('oauthLinkedAccounts', JSON.stringify(accounts));
      }

      return HtmlService.createHtmlOutput('Success! Your Google account (' + email + ') is now linked and will receive contact updates. You can close this tab.');
  } catch (err) {
      return HtmlService.createHtmlOutput('Authorization succeeded, but linking failed: ' + err.message);
  }
} else {
  return HtmlService.createHtmlOutput('Access Denied. You must allow permissions to link your account.');
}
}