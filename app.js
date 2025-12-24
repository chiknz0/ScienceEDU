/*
 * ============================================================================
 * INSTRUCTIONS
 * ============================================================================
 * 1. Save this entire code block as a single file named `app.js`.
 * 2. IMPORTANT: Change the `ADMIN_PASSWORD` below to a secure password of your choice.
 * 3. Open your terminal or command prompt.
 * 4. Run `npm init -y` and then `npm install express`.
 * 5. Run the application with the command: `node app.js`.
 * 6. Open your web browser and go to http://localhost:3000
 * ============================================================================
 */

// ============================================================================
// 1. SETUP AND CONFIGURATION
// ============================================================================
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'visitors.json');

// !!! CHANGE THIS PASSWORD !!!
const ADMIN_PASSWORD = 'ChangeMeNow123';

// ============================================================================
// 2. MIDDLEWARE
// ============================================================================
// This allows the server to receive JSON data from the frontend
app.use(express.json());
// This serves static files (like our HTML page) from a 'public' folder
app.use(express.static('public'));

// ============================================================================
// 3. BACKEND: LOGGING ENDPOINT
// ============================================================================
// This endpoint receives location data from the user's browser
app.post('/log-location', async (req, res) => {
    try {
        const visitorData = req.body;
        visitorData.ip = req.ip || req.connection.remoteAddress; // Get user's IP
        visitorData.timestamp = new Date().toISOString();

        let visitors = [];
        // Try to read existing data
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            visitors = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, it's fine, we'll create a new one
        }

        visitors.push(visitorData);
        // Save the updated data back to the file
        await fs.writeFile(DATA_FILE, JSON.stringify(visitors, null, 2));

        console.log(`Location logged from IP: ${visitorData.ip}`);
        res.status(200).json({ message: 'Location logged successfully' });
    } catch (error) {
        console.error('Error logging location:', error);
        res.status(500).json({ message: 'Failed to log location' });
    }
});

// ============================================================================
// 4. BACKEND: ADMIN VIEW ENDPOINT
// ============================================================================
// This endpoint shows the visitor list after a password is entered
app.get('/admin', async (req, res) => {
    const password = req.query.password;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).send('<h1>Forbidden</h1><p>Incorrect password.</p>');
    }

    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const visitors = JSON.parse(data);

        // Generate an HTML table to display the data
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Visitor Log</title>
            <style> body { font-family: sans-serif; margin: 20px; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } </style>
        </head>
        <body>
            <h1>Visitor Log</h1>
            <table>
                <tr>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Accuracy (meters)</th>
                </tr>
        `;

        visitors.forEach(v => {
            html += `<tr>
                <td>${v.timestamp}</td>
                <td>${v.ip}</td>
                <td>${v.latitude}</td>
                <td>${v.longitude}</td>
                <td>${v.accuracy}</td>
            </tr>`;
        });

        html += `
            </table>
        </body>
        </html>`;

        res.send(html);
    } catch (error) {
        res.status(500).send('<h1>Error</h1><p>Could not read visitor data.</p>');
    }
});

// ============================================================================
// 5. START THE SERVER
// ============================================================================
app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the site.`);
    console.log(`Open http://localhost:${PORT}/admin?password=${ADMIN_PASSWORD} to view the log.`);
});
