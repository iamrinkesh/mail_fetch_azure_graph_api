const { ConfidentialClientApplication } = require('@azure/msal-node');
const crypto = require('crypto'); // For PKCE generation
const querystring = require('querystring');
const config = require('../config/config');
const axios = require('axios');

// MSAL client instance
const msalClient = new ConfidentialClientApplication({
    auth: {
        clientId: config.msal.clientId,
        authority: `https://login.microsoftonline.com/${config.msal.tenantId}`,
        redirectUri: config.msal.redirectUri,
        clientSecret: config.msal.clientSecret,  // Add the client secret here
    },
    system: {
        loggerOptions: {
            loggerCallback(logLevel, message, piiEnabled) {
                console.log(message);
            },
        },
    },
});

// Generate PKCE challenge and verifier
function generatePKCEChallenge() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
}

// Generate the authorization URL
function getAuthUrl(req, res) {
    const { codeVerifier, codeChallenge } = generatePKCEChallenge();
    console.log('code verifier:', codeVerifier);

    // Store the codeVerifier in a cookie (expires in 1 hour for example)
    req.session.codeVerifier = codeVerifier;
    req.session.codeChallenge = codeChallenge;

    const authCodeUrlParams = {
        client_id: config.msal.clientId,
        response_type: 'code',
        redirect_uri: config.msal.redirectUri,
        scope: 'https://graph.microsoft.com/Mail.ReadWrite offline_access',
        response_mode: 'query',
        state: 'unique-state-value', // Use a unique value for state
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    };

    // Redirect the user to the Microsoft authorization URL
    const authUrl = `https://login.microsoftonline.com/${config.msal.tenantId}/oauth2/v2.0/authorize?${querystring.stringify(authCodeUrlParams)}`;
    // console.log('auth url',authUrl)
    return authUrl; // Redirect to authorization URL
}

// Exchange authorization code for tokens
async function getTokenFromCode(req, code, codeVerifier) {
    const tokenRequest = {
        code,
        scopes: ['https://graph.microsoft.com/Mail.ReadWrite', 'offline_access'],
        redirectUri: config.msal.redirectUri,
        codeVerifier, // Use the codeVerifier from the session or cookies
    };
    console.log('tokenRequest:', tokenRequest);

    try {
        // Attempt to acquire the token
        const tokenResponse = await msalClient.acquireTokenByCode(tokenRequest);
        console.log('tokenResponse:', tokenResponse);
        return tokenResponse;
    } catch (error) {
        // Log full error details for troubleshooting
        console.error('Error during token acquisition:', error.response?.data || error.message || error);
        
        // Handle specific MSAL error response, if available
        if (error.response && error.response.data) {
            console.error('Error Response:', error.response.data);
        }
        
        throw new Error('Failed to acquire token using the authorization code');
    }
}

module.exports = { getAuthUrl, getTokenFromCode };
