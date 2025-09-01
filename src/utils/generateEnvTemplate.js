#!/usr/bin/env node

/**
 * Environment Template Generator
 * 
 * Generates .env.example file from the validation schema.
 * This ensures documentation stays in sync with actual requirements.
 * 
 * Usage: node src/utils/generateEnvTemplate.js
 */

const fs = require('fs');
const path = require('path');
const { generateEnvTemplate } = require('./validateEnv');

// Generate template from schema
const template = generateEnvTemplate();
const outputPath = path.join(__dirname, '../../.env.example');

// Write to file
fs.writeFileSync(outputPath, template);

// Use process.stdout for CLI tools (avoids console.log)
process.stdout.write('✅ Generated .env.example file\n');
process.stdout.write(`📁 Location: ${outputPath}\n`);