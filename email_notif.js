import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import boxen from 'boxen';
import chalk from 'chalk';
import stringWidth from 'string-width';  // Used to measure the width of the text

// Function to center text by padding spaces
function centerText(text, width) {
    const textWidth = stringWidth(text); // Measure the width of the text
    const padding = Math.max(0, Math.floor((width - textWidth) / 2)); // Calculate padding
    return ' '.repeat(padding) + text + ' '.repeat(padding);
}

const auth = new google.auth.GoogleAuth({
    keyFile: '/Users/raoabdul/Documents/Development/google.json',
    scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
});

// Nodemailer setup for sending email
const transporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com", // Replace with your SMTP server
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "mailjet_api_key", // Replace with your Mailjet API key
        pass: "mailjet_secret_key", // Replace with your Mailjet secret key
    },
});

// Function to send the email
async function sendEmail(fileDetails, recipientEmail) {
    const mailOptions = {
        from: '"Your App Name" <your-email@example.com>', // Replace with your email
        to: recipientEmail,
        subject: 'Google Drive File Details',
        text: fileDetails, // Plain text body
        html: `<pre>${fileDetails}</pre>`, // HTML body (with preformatted text)
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(chalk.green(`Email sent to ${recipientEmail}`));
    } catch (error) {
        console.error(chalk.red(`Failed to send email: ${error}`));
    }
}

// Function to get files list by folder ID
async function getFilesList(folderId) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.files.list({
            'q': `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, modifiedTime)'
        });
        return response.data.files;
    } catch (error) {
        console.error('Error fetching files list:', error);
    }
}

// Function to check for a specific folder by name
async function checkFolder(folderName) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.files.list({
            'q': `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
            fields: 'files(id, name)',
        });
        const folders = response.data.files;
        if (folders.length > 0) {
            console.log(`Folder "${folderName}" found with ID: ${folders[0].id}`);
            return folders[0].id;
        } else {
            console.log(`Folder "${folderName}" not available.`);
            return null;
        }
    } catch (error) {
        console.error('Error finding folder:', error);
    }
}

// Self-invoking async function to execute read, write, and send email
(async () => {
    const folderName = 'Snaprove Testing';

    // Check if the folder exists and get the folder ID
    const folderId = await checkFolder(folderName);
    
    if (folderId) {
        // Get the list of files in the folder
        const filesList = await getFilesList(folderId);
        
        // Prepare the file details for email
        const fileDetails = filesList.map(file => 
            `File: ${file.name}\nMIME Type: ${file.mimeType}\nLast Modified: ${new Date(file.modifiedTime).toLocaleString()}\n`
        ).join('\n--------------------\n');

        console.log(chalk.blue(`Sending file details to your email...`));

        // Send the file details to the specified email
        await sendEmail(fileDetails, "raoabdulhadi952@gmail.com"); // Replace with the recipient's email address
    }
})();
