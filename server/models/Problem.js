import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  hidden: {
    type: Boolean,
    default: false
  }
});

const exampleSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  explanation: {
    type: String
  }
});

const starterCodeSchema = new mongoose.Schema({
  javascript: String,
  python: String,
  java: String,
  cpp: String
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  examples: [exampleSchema],
  constraints: [{
    type: String
  }],
  starterCode: starterCodeSchema,
  testCases: [testCaseSchema],
  acceptance: {
    type: Number,
    default: 0
  },
  submissions: {
    type: Number,
    default: 0
  },
  acceptedSubmissions: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isContestOnly: {
    type: Boolean,
    default: false
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  availableAfter: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add performance indexes for better query optimization
problemSchema.index({ difficulty: 1, category: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ createdAt: -1 });
problemSchema.index({ submissions: -1 });
problemSchema.index({ acceptance: -1 });
problemSchema.index({ isContestOnly: 1, contest: 1 });
problemSchema.index({ availableAfter: 1 });
problemSchema.index({ createdBy: 1 });

// Compound index for common queries
problemSchema.index({ difficulty: 1, createdAt: -1 });
problemSchema.index({ category: 1, difficulty: 1, createdAt: -1 });

// Text index for search functionality
problemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Update acceptance rate when submissions change
problemSchema.methods.updateAcceptance = function() {
  if (this.submissions > 0) {
    this.acceptance = Math.round((this.acceptedSubmissions / this.submissions) * 100 * 10) / 10;
  }
};

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;