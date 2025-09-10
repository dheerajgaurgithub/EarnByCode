import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkJobs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Import Job model
    const Job = (await import('./models/Job.js')).default;

    // Find all jobs
    const jobs = await Job.find({});
    console.log('\n📋 All Jobs in Database:');
    console.log(JSON.stringify(jobs, null, 2));
    
    // Count active jobs
    const activeJobs = await Job.countDocuments({ isActive: true });
    console.log(`\n✅ Found ${jobs.length} total jobs (${activeJobs} active)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkJobs();
