/// <reference types="@azure/msal-browser" />
/** @type {import("@azure/msal-browser")} */
var msal = window.msal;

const forecastScope =
  "api://404f9553-0b64-4e14-b1d0-bc0c7caffcac/access_as_user";

const msalContainer = document.getElementById("msal-login");
const tokensList = document.getElementById("tokens");
const forecastContainer = document.getElementById("forecast");

const publicClient = new msal.PublicClientApplication({
  auth: {
    clientId: "8a612ea2-4d70-4837-a69d-d2a003384c37",
    redirectUri: location.origin + "/",
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
  .catch((error) => renderError(msalContainer, error));

initMSALLogin();

function initMSALLogin() {
  const activeAccount = publicClient.getActiveAccount();
  if (activeAccount) {
    const name = sanitizeHtml(activeAccount.name);
    const username = sanitizeHtml(activeAccount.username);
    msalContainer.innerHTML = `<p>MSAL.JS logged in as ${name} (${username}). <br/><button type="button" class="btn btn-link" onclick="onLogout()">Sign out MSAL.JS</button></p>`;
    updateTokens(activeAccount);
    updateForecast();
  } else {
    msalContainer.innerHTML = `<button type="button" class="btn btn-primary" onclick="onLogin()">Login MSAL.JS</button>`;
  }
}

function updateTokens(activeAccount = publicClient.getActiveAccount()) {
  let tokens = [];

  for (let idToken of getRawTokens(activeAccount, "id_token")) {
    tokens.push(
      `<li><a href="https://jwt.ms/#id_token=${idToken.secret}" target="_blank">View id_token</a></li>`
    );
  }

  for (let accessToken of getRawTokens(activeAccount, "access_token")) {
    tokens.push(
      `<li><a href="https://jwt.ms/#access_token=${accessToken.secret}" target="_blank">View access_token for <code>${accessToken.target}</code></a></li>`
    );
  }

  tokensList.innerHTML = `<h2>Tokens</h2><ul>${tokens.join("\n")}</ul>`;
}

async function updateForecast() {
  try {
    const accessToken = await publicClient.acquireTokenSilent({
      scopes: [forecastScope],
    });

    const res = await fetch("https://localhost:7202/weatherforecast", {
      headers: { Authorization: "Bearer " + accessToken.accessToken },
    });

    const json = await res.json();

    const result = JSON.stringify(json, null, 2);
    forecastContainer.innerHTML = `<h2>Forecast</h2><pre>${result}</pre>`;

    updateTokens();
  } catch (error) {
    renderError(forecastContainer, error);
  }
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

/**
 * @param {HTMLElement} container
 * @param {any} error
 */
function renderError(container, error) {
  let errorMessage =
    error instanceof Error ? error.stack : JSON.stringify(error, null, 2);

  container.innerHTML = `
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

function sanitizeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
