// Import the googleapis library
const { google } = require('googleapis');

// Set up Google authentication with the necessary scopes for Google Docs
const auth = new google.auth.GoogleAuth({
    keyFile: '/Users/raoabdul/Documents/Development/google.json', // Path to your JSON key file
    scopes: ['https://www.googleapis.com/auth/documents'] // Scope for Google Docs
});

// Function to read from a Google Docs document
async function readGoogleDocs(documentId) {
    try {
        const docs = google.docs({ version: 'v1', auth }); // Create a Google Docs API client

        // Retrieve the document content
        const response = await docs.documents.get({ documentId }); // ID of the document to read
        return response.data // Return the document data
    } catch (error) {
        console.error('error', error); // Log any errors that occur
    }
}

// Self-invoking async function to execute the read and write operations
(async () => {
    // Example of reading from a document
    const data = await readGoogleDocs('11SbzfM5FgyJeoBOrBT35rMZNfQQLsiY5PkPB39aYIuw');
    // Extract and log the text content from the document
    console.log(data.body.content.map(d => d.paragraph?.elements[0]['textRun']));
})()