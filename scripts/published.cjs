'use strict';

const { readdirSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const notPresets = new Set(['package.json', 'package-lock.json', 'renovate.json']);

module.exports = readdirSync(root)
  .filter(file => file.endsWith('.json') && !notPresets.has(file))
  .sort();
