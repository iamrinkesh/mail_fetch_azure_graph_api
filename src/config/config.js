require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'CLIENT_SECRET', 'TENANT_ID'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        process.exit(1); // Exit the application if any required variable is missing
    }
});

const config = {
    port: process.env.PORT || 3000,
    msal: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        tenantId: process.env.TENANT_ID,
        redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/callback',
    },
    logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
