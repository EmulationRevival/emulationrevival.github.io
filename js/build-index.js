const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); 

/**
 * build-index.js
 * Scans library pages and generates a search-index.json file.
 * Run this in Termux using: node js/build-index.js
 */

// The files the script will "read" to build your search database
const PAGES_TO_INDEX = [
    'xbox-dev-mode/emulators.html',
    'xbox-dev-mode/ports.html',
    'xbox-dev-mode/utilities.html',
    'xbox-dev-mode/apps.html',
    'xbox-dev-mode/frontends.html',
    'xbox-dev-mode/media-apps.html',
    'xbox-dev-mode/wip-apps.html'
];

let masterIndex = [];

console.log('Starting search index build...');

PAGES_TO_INDEX.forEach(filePath => {
    // Navigate up from /js and into the target file path
    const fullPath = path.join(__dirname, '../', filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.warn(`skipping: File not found at ${fullPath}`);
        return;
    }

    const html = fs.readFileSync(fullPath, 'utf8');
    const $ = cheerio.load(html);

    // Targets elements with the .card class
    $('.card').each((i, el) => {
        const title = $(el).find('.card-title, h3').first().text().trim();
        const desc = $(el).find('.card-description, p').first().text().trim();
        
        // --- IMAGE EXTRACTION ---
        // Specifically targets the img tag source within the card
        const img = $(el).find('img').attr('src');

        const id = $(el).attr('id') || $(el).closest('[id]').attr('id');

        if (title) {
            // Clean up the category name for the UI (e.g., "media-apps" -> "Media apps")
            let cleanCategory = filePath.split('/').pop().replace('.html', '');
            cleanCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1).replace(/-/g, ' ');

            masterIndex.push({
                name: title,
                description: desc,
                img: img || '', // Captures the relative path to the image
                url: `/${filePath}${id ? '#' + id : ''}`,
                category: cleanCategory
            });
        }
    });
});

// --- OUTPUT LOGIC ---

// Define the directory path (moving up from /js and into /json)
const jsonDir = path.join(__dirname, '../json');

// Ensure the /json directory exists; if not, create it
if (!fs.existsSync(jsonDir)){
    console.log('Creating /json directory...');
    fs.mkdirSync(jsonDir, { recursive: true });
}

// Define the final file path
const outputPath = path.join(jsonDir, 'search-index.json');

// Write the file to the /json folder
try {
    fs.writeFileSync(outputPath, JSON.stringify(masterIndex, null, 2));
    console.log('-------------------------------------------');
    console.log(`Success! Index built with ${masterIndex.length} items.`);
    console.log(`Saved to: ${outputPath}`);
    console.log('-------------------------------------------');
} catch (err) {
    console.error('Error writing the JSON file:', err);
}
