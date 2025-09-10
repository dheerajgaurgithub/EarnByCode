import express from 'express';
import Career from '../models/Career.js';
import JobApplication from '../models/JobApplication.js';
import { isAdmin } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get all careers (public)
router.get('/', async (req, res) => {
  try {
    const { department, type, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    
    if (department) query.department = department;
    if (type) query.type = type;
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: '-applications -__v',
      populate: {
        path: 'postedBy',
        select: 'username email'
      }
    };
    
    const careers = await Career.paginate(query, options);
    res.json(careers);
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({ message: 'Error fetching careers' });
  }
});

// Get single career (public)
router.get('/:id', async (req, res) => {
  try {
    const career = await Career.findById(req.params.id)
      .populate('postedBy', 'username email')
      .select('-applications -__v');
      
    if (!career) {
      return res.status(404).json({ message: 'Career not found' });
    }
    
    // Increment views
    career.metadata.views += 1;
    await career.save();
    
    res.json(career);
  } catch (error) {
    console.error('Error fetching career:', error);
    res.status(500).json({ message: 'Error fetching career' });
  }
});

// Admin routes
router.use(requireAdmin);

// Create new career
router.post('/', async (req, res) => {
  try {
    const careerData = {
      ...req.body,
      postedBy: req.user._id,
      'metadata.views': 0,
      'metadata.applicationsCount': 0
    };
    
    const career = new Career(careerData);
    await career.save();
    
    res.status(201).json(career);
  } catch (error) {
    console.error('Error creating career:', error);
    res.status(400).json({ message: 'Error creating career', error: error.message });
  }
});

// Update career
router.put('/:id', async (req, res) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!career) {
      return res.status(404).json({ message: 'Career not found' });
    }
    
    res.json(career);
  } catch (error) {
    console.error('Error updating career:', error);
    res.status(400).json({ message: 'Error updating career' });
  }
});

// Delete career
router.delete('/:id', async (req, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id);
    
    if (!career) {
      return res.status(404).json({ message: 'Career not found' });
    }
    
    // Delete associated applications
    await JobApplication.deleteMany({ jobId: career._id });
    
    res.json({ message: 'Career deleted successfully' });
  } catch (error) {
    console.error('Error deleting career:', error);
    res.status(500).json({ message: 'Error deleting career' });
  }
});

// Get applications for a career
router.get('/:id/applications', async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.id })
      .populate('applicant', 'username email')
      .sort({ createdAt: -1 });
      
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Upload resume
const uploadResume = upload.single('resume');
router.post('/:id/apply', uploadResume, async (req, res) => {
  try {
    const { fullName, email, phone, coverLetter } = req.body;
    const resume = req.file;
    
    if (!resume) {
      return res.status(400).json({ message: 'Resume is required' });
    }
    
    const application = new JobApplication({
      jobId: req.params.id,
      applicant: req.user?._id,
      fullName,
      email,
      phone,
      coverLetter,
      resume: {
        url: `/uploads/resumes/${resume.filename}`,
        filename: resume.originalname,
        path: resume.path
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    await application.save();
    
    // Increment applications count
    await Career.findByIdAndUpdate(req.params.id, {
      $inc: { 'metadata.applicationsCount': 1 },
      $push: { applications: application._id }
    });
    
    res.status(201).json(application);
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(400).json({ message: 'Error submitting application', error: error.message });
  }
});

export default router;
