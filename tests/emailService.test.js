const { fetchEmails } = require('../src/services/emailService');

test('fetchEmails returns a list of emails', async () => {
    const mockToken = 'mock-access-token'; // Replace with a real token in production
    const emails = await fetchEmails(mockToken);
    expect(emails).toBeInstanceOf(Array); // Expect the result to be an array
});

