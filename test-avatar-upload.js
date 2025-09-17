const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const UPLOAD_DIR = path.join(__dirname, 'server', 'public', 'uploads', 'avatars');
const TEST_IMAGE_PATH = path.join(__dirname, 'test-uploads', 'test-avatar.png');
const API_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with a valid token

async function testAvatarUpload() {
  try {
    console.log('Testing avatar upload functionality...');
    
    // 1. Check if upload directory exists and is writable
    console.log('\n1. Checking upload directory...');
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        console.log(`Creating upload directory: ${UPLOAD_DIR}`);
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      
      // Test write permission
      const testFile = path.join(UPLOAD_DIR, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✓ Upload directory is writable');
    } catch (error) {
      console.error('✗ Error with upload directory:', error.message);
      return;
    }
    
    // 2. Create a test image if it doesn't exist
    console.log('\n2. Preparing test image...');
    try {
      if (!fs.existsSync(path.dirname(TEST_IMAGE_PATH))) {
        fs.mkdirSync(path.dirname(TEST_IMAGE_PATH), { recursive: true });
      }
      
      if (!fs.existsSync(TEST_IMAGE_PATH)) {
        const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        fs.writeFileSync(TEST_IMAGE_PATH, Buffer.from(base64Image, 'base64'));
      }
      console.log(`✓ Test image ready at: ${TEST_IMAGE_PATH}`);
    } catch (error) {
      console.error('✗ Error creating test image:', error.message);
      return;
    }
    
    // 3. Test the avatar upload endpoint
    console.log('\n3. Testing avatar upload...');
    try {
      const form = new FormData();
      form.append('avatar', fs.createReadStream(TEST_IMAGE_PATH));
      
      const response = await axios.post(`${API_URL}/users/me/avatar`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      console.log('✓ Avatar upload successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.avatar) {
        console.log(`\n4. Testing avatar access at: ${response.data.avatarUrl || response.data.avatar}`);
        try {
          const avatarUrl = response.data.avatarUrl || `${API_URL}${response.data.avatar}`;
          const avatarResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
          console.log(`✓ Avatar accessible! Status: ${avatarResponse.status}`);
        } catch (error) {
          console.error('✗ Failed to access avatar:', error.message);
        }
      }
      
    } catch (error) {
      console.error('✗ Avatar upload failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error(error.message);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAvatarUpload();
