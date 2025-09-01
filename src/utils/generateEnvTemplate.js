#!/usr/bin/env node

/**
 * Script to generate .env.example file from validation schema
 */

const fs = require('fs');
const path = require('path');
const { generateEnvTemplate } = require('./validateEnv');

const template = generateEnvTemplate();
const outputPath = path.join(__dirname, '../../.env.example');

fs.writeFileSync(outputPath, template);
console.log('✅ Generated .env.example file');
console.log(`📁 Location: ${outputPath}`);