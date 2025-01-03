const express = require('express');
const { login, callback, getEmails } = require('../controllers/emailController');
const router = express.Router();

router.get('/login', login); // Login route
router.get('/callback', callback); // Callback route
router.get('/emails', getEmails); // Fetch emails route

module.exports = router;
