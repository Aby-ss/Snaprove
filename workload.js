// Load the Google APIs client library
const { google } = require('googleapis');

// Set up OAuth2 client with your credentials
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

// Initialize the OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set the refresh token for the OAuth2 client
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Initialize the Google Drive API
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Function to list and download Google Docs files
async function listAndDownloadGoogleDocs() {
  try {
    // List files in Google Drive
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.forEach((file) => {
        console.log(`${file.name} (${file.id})`);
        // Download the file as a PDF
        downloadFile(file.id, file.name);
      });
    } else {
      console.log('No files found.');
    }
  } catch (error) {
    console.error('Error listing files:', error);
  }
}

// Function to download a file from Google Drive
async function downloadFile(fileId, fileName) {
  try {
    const res = await drive.files.export(
      { fileId: fileId, mimeType: 'application/pdf' },
      { responseType: 'stream' }
    );

    // Save the file
    const dest = require('fs').createWriteStream(`./${fileName}.pdf`);
    res.data
      .on('end', () => {
        console.log(`Downloaded ${fileName}.pdf`);
      })
      .on('error', (err) => {
        console.error('Error downloading file:', err);
      })
      .pipe(dest);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

// Run the script
listAndDownloadGoogleDocs();
