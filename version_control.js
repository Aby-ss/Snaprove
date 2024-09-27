import { google } from 'googleapis';
import boxen from 'boxen';
import chalk from 'chalk';
import stringWidth from 'string-width';
import readline from 'readline';

// Google API authentication
const auth = new google.auth.GoogleAuth({
    keyFile: '/Users/raoabdul/Documents/Development/google.json',
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
});

// Function to center text within a box width
function centerText(text, width) {
    const textWidth = stringWidth(text); // Measure text width
    const padding = Math.max(0, Math.floor((width - textWidth) / 2)); // Calculate padding
    return ' '.repeat(padding) + text + ' '.repeat(padding);
}

// Function to check for a folder by name
async function checkFolder(folderName) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
            fields: 'files(id, name)',
        });

        const folders = response.data.files;
        if (folders.length > 0) {
            console.log(chalk.green(`Folder "${folderName}" found with ID: ${folders[0].id}`));
            return folders[0].id; // Return folder ID
        } else {
            console.log(chalk.red(`Folder "${folderName}" not available.`));
            return null;
        }
    } catch (error) {
        console.error('Error finding folder:', error);
    }
}

// Function to fetch file version history (via revisions API)
async function getFileVersions(fileId) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const revisions = await drive.revisions.list({
            fileId: fileId,
            fields: 'revisions(id, modifiedTime, lastModifyingUser(displayName))',
        });

        return revisions.data.revisions;
    } catch (error) {
        console.error('Error fetching file versions:', error);
    }
}

// Function to display version history in styled boxen format
async function displayVersionHistory(fileId, fileName) {
    const revisions = await getFileVersions(fileId);
    const boxWidth = 75; // Define the width of the box

    if (revisions) {
        console.log(chalk.yellow(`Version history for file: ${fileName}`));
        revisions.forEach((revision, index) => {
            const modifiedTime = new Date(revision.modifiedTime).toLocaleString();
            const userName = revision.lastModifyingUser?.displayName || 'Unknown User';
            const versionNumber = `Version ${index + 1}`;
            const titleText = centerText(versionNumber, boxWidth);
            const dateText = centerText(`Modified: ${modifiedTime}`, boxWidth);
            const userText = centerText(`By: ${userName}`, boxWidth);

            const output = `
${chalk.blue.bold(titleText)}
${chalk.blue.bold(dateText)}
${chalk.white(userText)}
`;

            const styledOutput = boxen(output, {
                padding: 1,                // Add padding inside the box
                margin: 1,                 // Add margin around the box
                borderColor: 'blue',       // Set border color to blue
                borderStyle: 'bold',       // Set bold border style
                textAlignment: 'left',     // Align text to the left
                width: boxWidth            // Set the box width to maintain alignment
            });

            console.log(styledOutput);
        });
    } else {
        console.log(chalk.red('No version history found for this file.'));
    }
}

// Function to fetch and display versions for all files in a specific folder
async function displayFolderVersionHistory(folderId) {
    try {
        const drive = google.drive({ version: 'v3', auth });

        // Get list of files inside the folder
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)',
        });

        const files = response.data.files;

        if (files.length > 0) {
            console.log(chalk.green(`Found ${files.length} files in the folder.`));
            for (const file of files) {
                await displayVersionHistory(file.id, file.name); // Display version history for each file
            }
        } else {
            console.log(chalk.red('No files found in the folder.'));
        }
    } catch (error) {
        console.error('Error fetching files list:', error);
    }
}

// Function to get folder name from user input
function askFolderName() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Enter the folder name: ', (folderName) => {
            rl.close();
            resolve(folderName);
        });
    });
}

// Main function to search for folder and display version control history
(async () => {
    const folderName = await askFolderName(); // Get folder name from user
    const folderId = await checkFolder(folderName); // Check if the folder exists

    if (folderId) {
        await displayFolderVersionHistory(folderId); // Display version history if folder exists
    } else {
        console.log(chalk.red('Unable to proceed without folder.'));
    }
})();
