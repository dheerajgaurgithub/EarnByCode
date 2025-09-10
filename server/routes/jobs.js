import express from 'express';
import Job from '../models/Job.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
// Configure multer to use memory storage instead of disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// @route   GET /api/jobs
// @desc    Get all active jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .select('-applications')
      .sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jobs/admin
// @desc    Get all jobs (admin only)
// @access  Private/Admin
router.get('/admin', [authenticate, requireAdmin], async (req, res) => {
  try {
    const jobs = await Job.find().sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    console.error('Admin jobs fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private/Admin
router.post('/', [authenticate, requireAdmin], async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      postedBy: req.user.id
    });

    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job posting
// @access  Private/Admin
router.put('/:id', [authenticate, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove _id from update data to prevent modification
    delete updateData._id;
    delete updateData.postedBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.applications;

    // Ensure salary is properly structured
    if (updateData.salary) {
      updateData.salary = {
        min: Number(updateData.salary.min) || 0,
        max: Number(updateData.salary.max) || 0,
        currency: (updateData.salary.currency || 'USD').toUpperCase(),
        period: (updateData.salary.period || 'year').toLowerCase()
      };

      // Validate min <= max
      if (updateData.salary.min > updateData.salary.max) {
        return res.status(400).json({ 
          message: 'Maximum salary must be greater than or equal to minimum salary' 
        });
      }
    }

    const job = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error('Error updating job:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: messages 
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'A job with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job posting
// @access  Private/Admin
router.delete('/:id', [authenticate, requireAdmin], async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/jobs/:id/apply
// @desc    Apply for a job
// @access  Private
router.post('/:id/apply', [authenticate, upload.single('resume')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = job.applications.find(
      app => app.userId.toString() === req.user.id
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this position' });
    }

    // Add application with resume info (not the actual file)
    job.applications.push({
      userId: req.user.id,
      resume: `Resume received from ${req.user.email} (${req.file.originalname})`,
      coverLetter: req.body.coverLetter || '',
      status: 'pending'
    });

    await job.save();

    try {
      // Prepare email with attachment
      const emailData = {
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: `New Job Application for ${job.title}`,
        text: `A new application has been submitted for the ${job.title} position.`,
        html: `
          <h2>New Job Application</h2>
          <p><strong>Position:</strong> ${job.title}</p>
          <p><strong>Applicant:</strong> ${req.user.username} (${req.user.email})</p>
          <p><strong>Applied At:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Cover Letter:</strong></p>
          <p>${req.body.coverLetter || 'No cover letter provided.'}</p>
          <p>Please find the resume attached to this email.</p>
        `,
        attachments: [
          {
            filename: `${req.user.username.replace(/\s+/g, '_')}_resume${path.extname(req.file.originalname)}`,
            content: req.file.buffer,
            contentType: req.file.mimetype
          }
        ]
      };

      await sendEmail(emailData);
      
      // Log successful email sending
      console.log(`Application email sent for job ${job._id} by user ${req.user.id}`);
      
    } catch (emailError) {
      console.error('Error sending application email:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json({ 
      success: true,
      message: 'Application submitted successfully' 
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
