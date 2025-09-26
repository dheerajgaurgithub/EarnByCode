import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp'],
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'],
    required: true
  },
  // Formatted values (backward compatibility with existing data)
  runtime: {
    type: String
  },
  memory: {
    type: String
  },
  // Exact numeric values for analytics and accurate display
  runtimeMs: {
    type: Number
  },
  memoryKb: {
    type: Number
  },
  testsPassed: {
    type: Number,
    default: 0
  },
  totalTests: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;