/// <reference types="@azure/msal-browser" />
/** @type {import("@azure/msal-browser")} */
var msal = window.msal;

const publicClient = new msal.PublicClientApplication({
  auth: {
    clientId: "8a612ea2-4d70-4837-a69d-d2a003384c37",
  },
});

publicClient.handleRedirectPromise(location.hash).then((result) => {
  if (result) {
    console.log("Auth redirect response:", result);
    publicClient.setActiveAccount(result.account);
    initMSALLogin();
  }
});

initMSALLogin();

function initMSALLogin() {
  const msalContainer = document.getElementById("msal-login");

  const activeAccount = publicClient.getActiveAccount();
  if (activeAccount) {
    msalContainer.innerHTML = `
      <p>MSAL.JS logged in as ${activeAccount.name}.</p>
    `;
  } else {
    msalContainer.innerHTML = `<button class="btn btn-primary" onclick="onLogin()">Login</button>`;
  }
}

function onLogin() {
  publicClient.loginRedirect();
}
