#!/usr/bin/env node
const fs = require('fs');

// Get CONVEX_URL from environment variable or use a default for local development
const convexUrl = process.env.CONVEX_URL || '';

const configContent = `// Auto-generated config - DO NOT EDIT
window.CONFIG = {
    CONVEX_URL: "${convexUrl}"
};
`;

fs.writeFileSync('config.js', configContent);
console.log('✓ Generated config.js with CONVEX_URL');
