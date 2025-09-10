import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
    required: [true, 'Job type is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requirements: [{
    type: String,
    required: [true, 'At least one requirement is required']
  }],
  responsibilities: [{
    type: String,
    required: [true, 'At least one responsibility is required']
  }],
  salary: {
    min: { 
      type: Number,
      min: [0, 'Minimum salary cannot be negative'],
      required: [true, 'Minimum salary is required']
    },
    max: { 
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      required: [true, 'Maximum salary is required'],
      validate: {
        validator: function(v) {
          return v >= this.salary.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR'],
      uppercase: true,
      trim: true
    },
    period: {
      type: String,
      enum: ['hour', 'day', 'week', 'month', 'year'],
      default: 'year',
      lowercase: true,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resume: {
      type: String,
      required: [true, 'Resume information is required'],
      description: 'Stores information about the resume (filename, reference, etc.)'
    },
    coverLetter: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    notes: [{
      text: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text', department: 'text' });

const Job = mongoose.model('Job', jobSchema);

export default Job;