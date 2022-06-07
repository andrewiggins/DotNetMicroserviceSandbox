/// <reference types="@azure/msal-browser" />
/** @type {import("@azure/msal-browser")} */
var msal = window.msal;

const msalContainer = document.getElementById("msal-login");
const tokensList = document.getElementById("tokens");

const publicClient = new msal.PublicClientApplication({
  auth: {
    clientId: "8a612ea2-4d70-4837-a69d-d2a003384c37",
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
});

publicClient
  .handleRedirectPromise(location.hash)
  .then((result) => {
    if (result) {
      console.log("Auth redirect response:", result);
      publicClient.setActiveAccount(result.account);
      initMSALLogin();
    }
  })
  .catch((error) => {});

initMSALLogin();

function initMSALLogin() {
  const activeAccount = publicClient.getActiveAccount();
  if (activeAccount) {
    msalContainer.innerHTML = `<p>MSAL.JS logged in as ${activeAccount.name} (${activeAccount.username}). <br/><button type="button" class="btn btn-link" onclick="onLogout()">Sign out MSAL.JS</button></p>`;
    displayTokens(activeAccount);
  } else {
    msalContainer.innerHTML = `<button type="button" class="btn btn-primary" onclick="onLogin()">Login MSAL.JS</button>`;
  }
}

function displayTokens(activeAccount = publicClient.getActiveAccount()) {
  let html = [];

  for (let idToken of getRawTokens(activeAccount, "id_token")) {
    html.push(
      `<li><a href="https://jwt.ms/#id_token=${idToken.secret}" target="_blank">View id_token</a></li>`
    );
  }

  for (let accessToken of getRawTokens(activeAccount, "access_token")) {
    html.push(
      `<li><a href="https://jwt.ms/#access_token=${accessToken.secret}" target="_blank">View access_token for <code>${accessToken.target}</code></a></li>`
    );
  }

  tokensList.innerHTML = html.join("\n");
}

/**
 * @typedef MSALTokenCacheValue The properties of MSAL's token cache
 * @property {string} clientId
 * @property {"IdToken" | "RefreshToken"} credentialType
 * @property {string?} environment
 * @property {string} homeAccountId
 * @property {string} realm ID & Access Token only
 * @property {string} secret
 * @property {string} target AccessToken only - scopes for access token
 *
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @param {"id_token" | "access_token" | "refresh_token"} tokenType
 * @returns {MSALTokenCacheValue[]}
 */
function getRawTokens(account, tokenType) {
  let tokenKey = tokenType.replace(/_/g, "");
  return (
    Object.keys(sessionStorage)
      // Filter session storage keys for ones related to this account and the requested access token
      .filter(
        (key) => key.includes(account.homeAccountId) && key.includes(tokenKey)
      )
      // Parse the values of sessionStorage and return them
      .map((key) => JSON.parse(sessionStorage.getItem(key)))
  );
}

function renderError(error) {
  let errorMessage =
    error instanceof Error ? error.stack : JSON.stringify(error);

  msalContainer.innerHTML = `
    <h2>Error</h2>
    <div><pre>${errorMessage}</pre></div>
    <button type="button" class="btn btn-primary" onclick="onLogout()">Start over</button>
  `;
}

function onLogin() {
  // @ts-ignore
  const serverAccount = window.serverAccount;

  publicClient.loginRedirect({
    scopes: ["openid", "profile"],
    loginHint: serverAccount?.login_hint,
    prompt: serverAccount ? undefined : "select_account",
  });
}

function onLogout() {
  sessionStorage.clear();
  location.reload();
}
