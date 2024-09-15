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

async function readGoogleDocs(documentId) {
    try {
        const docs = google.docs({ version: 'v1', auth });
        const response = await docs.documents.get({ documentId });
        return response.data;
    } catch (error) {
        console.error('Error fetching document content:', error);
    }
}

async function getDocumentMetadata(documentId) {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const file = await drive.files.get({
            fileId: documentId,
            fields: 'name, modifiedTime'
        });
        return file.data;
    } catch (error) {
        console.error('Error fetching document metadata:', error);
    }
}

function extractTextFromDoc(docData) {
    return docData.body.content
        .filter(d => d.paragraph?.elements[0]?.textRun)
        .map(d => d.paragraph.elements.map(el => el.textRun.content).join(''))
        .join('\n');
}

(async () => {
    const documentId = '11SbzfM5FgyJeoBOrBT35rMZNfQQLsiY5PkPB39aYIuw';

    // Get document content (title + body content)
    const docData = await readGoogleDocs(documentId);
    const documentTitle = docData.title;
    const documentContent = extractTextFromDoc(docData);

    // Get document metadata (last modified date)
    const metadata = await getDocumentMetadata(documentId);
    const lastModifiedDate = metadata.modifiedTime;

    const boxWidth = 75;

    // Center the title, last modified date, and content
    const titleText = centerText(`Document Title: ${documentTitle}`, boxWidth);
    const dateText = centerText(`Last Modified Date: ${new Date(lastModifiedDate).toLocaleString()}`, boxWidth);
    const contentText = documentContent.split('\n').map(line => centerText(line, boxWidth)).join('\n');

    // Styled output using boxen and chalk
    const output = `
${chalk.blue.bold(titleText)}
${chalk.blue.bold(dateText)}

${chalk.blue.bold(centerText('Document Content:', boxWidth))}
${chalk.white(contentText)}
`;

    const styledOutput = boxen(output, {
        padding: 1,
        margin: 1,
        borderColor: 'blue',
        borderStyle: 'bold',
        textAlignment: 'left',
        width: boxWidth  // Set the box width to maintain alignment
    });

    // Print the styled output
    console.log(styledOutput);
})();
