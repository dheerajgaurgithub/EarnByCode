const fs = require('fs');
const path = require('path');

// Paths
const uploadsDir = path.join(__dirname, 'server', 'public', 'uploads', 'avatars');
const testImagePath = path.join(uploadsDir, 'test-avatar.jpg');

// Create test image (a small red dot)
const testImage = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEB' +
  'AxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF' +
  '9AkGCEvAhMUFBUWEicYGRobHwMkLh8QYUIzNSYqKyCRUkQ1OC8RZzJjRDY3KCFyU1RFRkdISUpW' +
  'V1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrC' +
  'w8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP38ooooA//Z',
  'base64'
);

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created directory: ${uploadsDir}`);
}

// Write test image
fs.writeFileSync(testImagePath, testImage);
console.log(`Test image written to: ${testImagePath}`);

// Verify the file was written
if (fs.existsSync(testImagePath)) {
  console.log('Test successful! The file was created successfully.');
  console.log(`File size: ${fs.statSync(testImagePath).size} bytes`);
  
  // Test if the file can be read
  try {
    const fileContent = fs.readFileSync(testImagePath);
    console.log('File content read successfully.');
    console.log('First 20 bytes:', fileContent.subarray(0, 20).toString('hex'));
  } catch (error) {
    console.error('Error reading file:', error);
  }
} else {
  console.error('Error: Test file was not created.');
}
