const axios = require('axios');
const { convert } = require('html-to-text');

// Fetch emails from Microsoft Graph API
async function fetchEmails(accessToken) {
    try {
        // const senderEmails = ['no-reply@worldbiddingsource.com','no-reply@bidprime.com','notify@periscopeholdings.com']
        // let senderFilter = '';
        // if (senderEmails.length > 0) {
        //     const senderConditions = senderEmails.map(
        //         (email) => `from/emailAddress/address eq '${email}'`
        //     );
        //     senderFilter = `(${senderConditions.join(' or ')})`;
        // }

        // // Only include the filter for sender emails
        // const filter = senderFilter;
        // const subject = 'API Integration query';
        const response = await axios.get('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                // $filter: 'isRead eq false', // Filter for unread emails
                // $search: "subject:\"API Integration query\"",
                // $filter: filter,
                // $filter: `subject eq '${subject}'`,
                $orderby: 'receivedDateTime desc', // Order by receivedDateTime in descending order (most recent first)
                $top: 25, // Limit the number of emails to 25
                // $select: 'subject,bodyPreview,body',
            },
        });
        const emails = await Promise.all (response.data.value.map(async email => {
            let attachments = [];
            try {
                const attachmentResponse = await axios.get(
                    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/${email.id}/attachments`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                attachments = attachmentResponse.data.value;
            } catch (error) {
                console.error(`Error fetching attachments for email ID ${email.id}:`, error.message);
            }
            let bodyContent = '';

            if (email.body.contentType === 'html') {
                // Convert HTML to plain text
                bodyContent = convert(email.body.content, {
                    wordwrap: 130, // Optionally wrap text at 130 characters
                });
            } else if (email.body.contentType === 'text') {
                bodyContent = email.body.content; // Directly use plain text content
            }
            email.body.contentType = 'text'
            email.body.content = bodyContent;
            return {
                email,
                attachments
            };
        }));
        return emails; 
    } catch (error) {
        console.error('Error fetching emails:', error.message);
        throw new Error('Unable to fetch emails');
    }
}

module.exports = { fetchEmails };
