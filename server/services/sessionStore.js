// MongoDB-backed session store for compiler sessions
import CompilerSession from '../models/CompilerSession.js';

export async function set(sessionId, value) {
  const payload = Object.assign({}, value, { sessionId });
  await CompilerSession.findOneAndUpdate(
    { sessionId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function patch(sessionId, partial) {
  await CompilerSession.findOneAndUpdate(
    { sessionId },
    { $set: Object.assign({}, partial) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function get(sessionId) {
  const doc = await CompilerSession.findOne({ sessionId }).lean();
  if (!doc) return null;
  // Return plain object compatible with callers
  return {
    sessionId: doc.sessionId,
    submissionId: doc.submission || doc.submissionId,
    status: doc.status,
    language: doc.language,
    progress: doc.progress || undefined,
    result: doc.result || undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export default { set, patch, get };
