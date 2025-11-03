import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const resultSchema = new mongoose.Schema({
  status: { type: String },
  output: { type: String },
  error: { type: String },
  runtime: { type: String },
  memory: { type: String },
  testsPassed: { type: Number },
  totalTests: { type: Number },
}, { _id: false });

const compilerSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
  status: { type: String, required: true, index: true },
  language: { type: String, lowercase: true, trim: true },
  progress: { type: progressSchema, default: undefined },
  result: { type: resultSchema, default: undefined },
}, { timestamps: true });

compilerSessionSchema.index({ updatedAt: -1 });

const CompilerSession = mongoose.models.CompilerSession || mongoose.model('CompilerSession', compilerSessionSchema);
export default CompilerSession;
