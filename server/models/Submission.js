import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', default: null },

  code: { type: String, required: true },
  language: { type: String, required: true, lowercase: true, trim: true },

  // For single-run submissions (non-batch)
  input: { type: String, default: '' },
  output: { type: String, default: '' },
  error: { type: String, default: '' },

  status: { type: String, default: 'Queued', index: true },

  // Optional runtime/memory strings from executor (e.g., '123ms', '16.4MB')
  runtime: { type: String },
  memory: { type: String },

  // Numeric runtime in milliseconds for aggregations
  runtimeMs: { type: Number },

  // Batch execution summary
  testsPassed: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  testResults: [{
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    passed: { type: Boolean },
    error: { type: String },
    runtimeMs: { type: Number },
  }],

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true });

// Indexes for common queries
submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, createdAt: -1 });
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
submissionSchema.index({ status: 1, createdAt: -1 });

// Virtual duration in ms
submissionSchema.virtual('durationMs').get(function () {
  const start = this.startedAt ? new Date(this.startedAt).getTime() : null;
  const end = this.completedAt ? new Date(this.completedAt).getTime() : Date.now();
  return start ? (end - start) : null;
});

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
export default Submission;

