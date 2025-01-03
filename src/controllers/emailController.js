const { fetchEmails } = require('../services/emailService');
const { getAuthUrl, getTokenFromCode } = require('../auth/auth');
require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');

// Login Controller - Generates the auth URL and redirects the user
const login = async (req, res) => {
    try {
        const authUrl = await getAuthUrl(req, res);
        console.log('Auth URL:',authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Error while generating auth URL:', error.message);
        res.status(500).send('Failed to generate authentication URL.');
    }
};

// Callback Controller - Handles the response from Azure AD
const callback = async (req, res) => {
    const { code } = req.query; // Extract code from URL query params
    const { codeVerifier, codeChallenge } = req.session; // Retrieve data from session

    console.log('Received query parameters:', req.query);
    console.log('Code Verifier:', codeVerifier);
    console.log('Code Challenge:', codeChallenge);

    if (!code || !codeVerifier) {
        return res.status(400).json({ message: 'Authorization code or code verifier is missing.' });
    }

    try {
        const TenantID = process.env.TENANT_ID;
        const tokenEndpoint = `https://login.microsoftonline.com/${TenantID}/oauth2/v2.0/token`;

        const authCodeUrlParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code, // Authorization code
            redirect_uri: process.env.REDIRECT_URI,
            scope: 'openid offline_access',
            code_verifier: codeVerifier, // Ensure it matches the one sent during authorization
        });

        console.log('Token Endpoint:', tokenEndpoint);
        console.log('Request Payload:', authCodeUrlParams.toString());

        // Exchange authorization code for tokens
        const tokenResponse = await axios.post(tokenEndpoint, authCodeUrlParams.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Log the token response data
        console.log('Token Response Data:', tokenResponse.data);

        // Store tokens in a secure HTTP-only cookie
        res.cookie('token', JSON.stringify(tokenResponse.data), { httpOnly: true });

        // Clear the codeVerifier from the session (optional)
        req.session.codeVerifier = null;

        const emails = await fetchEmails(tokenResponse.data.access_token);
        // console.log('Fetched Mails',emails);
        // process.exit(0);

        // Send success response
        res.json({
            message: 'Mail Fetched successful!',
            mails: emails,
        });
    } catch (error) {
        // Handle the error and log meaningful details
        const errorDetails = error.response?.data || error.message;
        console.error('Error during authentication:', errorDetails);

        res.status(500).json({
            message: 'Authentication failed.',
            error: errorDetails,
        });
    }
};


// Get Emails Controller - Fetches emails using the stored access token
const getEmails = async (req, res) => {
    try {
        const token = req.session.token?.accessToken;

        if (!token) {
            return res.redirect('/login');
        }

        const emails = await fetchEmails(token);
        res.json(emails);
    } catch (error) {
        console.error('Error fetching emails:', error.message);
        res.status(500).send('Failed to fetch emails.');
    }
};

module.exports = { login, callback, getEmails };
