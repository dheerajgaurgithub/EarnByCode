import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '../../public');
const uploadsPath = path.join(publicPath, 'uploads/avatars');

// Check if directories exist
console.log('Checking directories...');
console.log('Public path:', publicPath);
console.log('Uploads path:', uploadsPath);

// Create directories if they don't exist
if (!fs.existsSync(publicPath)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicPath, { recursive: true });
}

if (!fs.existsSync(uploadsPath)) {
  console.log('Creating uploads/avatars directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Test file write permission
const testFile = path.join(uploadsPath, 'test.txt');
try {
  console.log('Testing write permission...');
  fs.writeFileSync(testFile, 'test');
  console.log('✓ Write test successful');
  fs.unlinkSync(testFile);
} catch (error) {
  console.error('✗ Write test failed:', error.message);
}

console.log('Directory check complete.');
