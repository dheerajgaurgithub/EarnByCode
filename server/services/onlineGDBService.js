import { v4 as uuidv4 } from 'uuid';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import { executeWithBestEffort } from '../utils/codeExecutor.js';
import { emit, emitToUser } from './ws.js';
import { beginTimer, increment } from './metrics.js';
import sessionStore from './sessionStore.js';

// Supported languages mapping
const SUPPORTED_LANGUAGES = new Set(['javascript', 'python', 'java', 'cpp']);

// Session store (Redis-backed when available)

function normalizeStatusFromResult(result) {
  if (!result) return 'Server Error';
  if (result.error && String(result.error).trim()) {
    const err = String(result.error).toLowerCase();
    if (err.includes('compile')) return 'Compilation Error';
    if (err.includes('time')) return 'Time Limit Exceeded';
    return 'Runtime Error';
  }
  return 'Completed';
}

function parseRuntimeMs(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
  const s = String(val || '').trim();
  const ms = s.match(/([0-9]+(?:\.[0-9]+)?)\s*ms/i);
  if (ms) return Math.round(parseFloat(ms[1]));
  const sec = s.match(/([0-9]+(?:\.[0-9]+)?)\s*s(ec)?/i);
  if (sec) return Math.round(parseFloat(sec[1]) * 1000);
  return undefined;
}

function normalizeText(s) {
  const t = String(s || '').replace(/\r\n/g, '\n');
  const lines = t.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length > 0);
  return lines.join('\n').toLowerCase();
}

function toDisplayRuntime(msText) {
  // Accept either numeric, "xxxms" or seconds
  if (typeof msText === 'number') return `${Math.round(msText)}ms`;
  const s = String(msText || '').trim();
  if (!s) return undefined;
  if (/ms$/i.test(s)) return s;
  return s;
}

async function runExecution(sessionId, submissionId, { code, language, input }) {
  const lang = String(language || '').toLowerCase();
  try {
    const endExec = beginTimer('exec_session');
    await sessionStore.set(sessionId, { submissionId, status: 'running', language: lang, createdAt: Date.now() });
    try { emit('compiler:session:update', { sessionId, status: 'running', language: lang, stage: 'running' }); } catch {}

    const result = await executeWithBestEffort(code, lang, input || '', { timeout: 15000 });

    const status = normalizeStatusFromResult(result);
    const runtime = toDisplayRuntime(result?.runtime);
    const memory = result?.memory;
    const out = String(result?.output ?? '').toString();
    const err = result?.error ? String(result.error) : '';

    // Update submission document
    if (submissionId) {
      try {
        await Submission.findByIdAndUpdate(submissionId, {
          status,
          output: out,
          error: err,
          runtime,
          memory,
          completedAt: new Date(),
        }, { new: true });
      } catch {}
    }

    await sessionStore.set(sessionId, { submissionId, status: 'completed', language: lang, result: { status: 'completed', output: out, error: err, runtime, memory }, completedAt: Date.now() });
    try { emit('compiler:session:update', { sessionId, status: 'completed', language: lang, output: out, error: err, runtime, memory }); } catch {}
    if (submissionId) {
      try {
        const doc = await Submission.findById(submissionId).select('user');
        if (doc?.user) emitToUser(doc.user, 'compiler:submission:update', { submissionId, status });
      } catch {}
    }
    endExec();
    increment('exec_success', 1);
    increment(`exec_lang_${lang}_count`, 1);
    if (err) {
      const low = err.toLowerCase();
      if (low.includes('compile')) increment('exec_error_compile', 1);
      else if (low.includes('time')) increment('exec_error_time', 1);
      else increment('exec_error_runtime', 1);
      increment(`exec_lang_${lang}_error`, 1);
    } else {
      increment(`exec_lang_${lang}_ok`, 1);
    }
  } catch (error) {
    const errMsg = (error && error.message) ? error.message : 'Execution failed';
    if (submissionId) {
      try {
        await Submission.findByIdAndUpdate(submissionId, {
          status: 'Server Error',
          error: errMsg,
          completedAt: new Date(),
        }, { new: true });
      } catch {}
    }
    await sessionStore.set(sessionId, { submissionId, status: 'error', language: lang, result: { status: 'error', output: '', error: errMsg }, completedAt: Date.now() });
    try { emit('compiler:session:update', { sessionId, status: 'error', language: lang, error: errMsg }); } catch {}
    increment('exec_error', 1);
    increment(`exec_lang_${lang}_error`, 1);
  }
}

export async function executeCode(code, language, input = '') {
  const lang = String(language || '').toLowerCase();
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const sessionId = uuidv4();
  await sessionStore.set(sessionId, { status: 'queued', language: lang, createdAt: Date.now() });
  try { emit('compiler:session:update', { sessionId, status: 'queued', language: lang, stage: 'queued' }); } catch {}

  // Detached run (no submission doc)
  runExecution(sessionId, null, { code, language: lang, input });

  return { sessionId };
}

export async function getExecutionResult(sessionId) {
  const session = await sessionStore.get(sessionId);
  if (!session) {
    return { status: 'not_found', error: 'Session not found' };
  }
  if (session.status === 'completed' || session.status === 'error') {
    return session.result || { status: session.status };
  }
  return { status: session.status };
}

export async function submitCode({ userId, problemId, code, language, contestId, input }) {
  const lang = String(language || '').toLowerCase();
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Minimal validation for problem
  let problem = null;
  try { problem = await Problem.findById(problemId).select('_id'); } catch {}
  if (!problem) {
    throw new Error('Problem not found');
  }

  // Create submission record
  const submission = await Submission.create({
    user: userId,
    problem: problemId,
    contest: contestId || null,
    code,
    language: lang,
    status: 'Queued',
    input: typeof input === 'string' ? input : '',
    startedAt: new Date(),
  });

  const sessionId = uuidv4();
  await sessionStore.set(sessionId, { submissionId: submission._id, status: 'queued', language: lang, createdAt: Date.now() });
  try { emit('compiler:session:update', { sessionId, status: 'queued', language: lang, stage: 'queued' }); } catch {}

  // Start execution asynchronously
  runExecution(sessionId, submission._id, { code, language: lang, input });

  return { submissionId: submission._id, sessionId };
}

export async function submitCodeBatch({ userId, problemId, code, language, contestId, compareMode }) {
  const lang = String(language || '').toLowerCase();
  if (!SUPPORTED_LANGUAGES.has(lang)) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const problem = await Problem.findById(problemId).lean();
  if (!problem) throw new Error('Problem not found');
  const tcs = Array.isArray(problem.testCases) ? problem.testCases : [];
  const total = tcs.length;
  if (total === 0) throw new Error('No test cases configured for this problem');

  // Create submission
  const submission = await Submission.create({
    user: userId,
    problem: problemId,
    contest: contestId || null,
    code,
    language: lang,
    status: 'Queued',
    startedAt: new Date(),
    totalTests: total,
  });

  const sessionId = uuidv4();
  await sessionStore.set(sessionId, { submissionId: submission._id, status: 'queued', language: lang, createdAt: Date.now() });
  try { emit('compiler:session:update', { sessionId, status: 'queued', language: lang, stage: 'queued' }); } catch {}

  (async () => {
    const endBatch = beginTimer('exec_batch');
    try {
      let passed = 0;
      let totalMs = 0;
      let hadError = false;
      let hadWrong = false;
      const cases = [];

      await sessionStore.patch(sessionId, { status: 'running', language: lang, progress: { current: 0, total } });
      emit('compiler:session:update', { sessionId, status: 'running', language: lang, stage: 'running', progress: { current: 0, total } });

      const strictNormalize = (s) => String(s || '').replace(/\r\n/g, '\n').trim();
      const useRelaxed = String(compareMode || 'relaxed').toLowerCase() !== 'strict';
      const cmp = (a, b) => useRelaxed ? (normalizeText(a) === normalizeText(b)) : (strictNormalize(a) === strictNormalize(b));

      for (let i = 0; i < total; i++) {
        const stdin = String(tcs[i]?.input ?? '');
        const expected = String(tcs[i]?.expectedOutput ?? '');
        const r = await executeWithBestEffort(code, lang, stdin, { timeout: 20000 });
        const out = normalizeText(r?.output ?? '');
        const err = normalizeText(r?.error ?? '');
        const ms = parseRuntimeMs(r?.runtime) || 0;
        totalMs += ms;
        let ok = false;
        if (err) { ok = false; hadError = true; }
        else if (expected) { ok = cmp(out, expected); if (!ok) hadWrong = true; }
        else { ok = true; }
        if (ok) passed += 1;
        cases.push({ input: stdin, expectedOutput: expected, actualOutput: out, passed: !!ok, error: err || undefined, runtimeMs: ms });
        // progress event
        await sessionStore.patch(sessionId, { progress: { current: i + 1, total } });
        emit('compiler:session:update', { sessionId, status: 'running', language: lang, stage: 'running', progress: { current: i + 1, total } });
      }

      const status = passed === total ? 'Accepted' : hadError ? 'Runtime Error' : 'Wrong Answer';
      await Submission.findByIdAndUpdate(submission._id, {
        status,
        testsPassed: passed,
        totalTests: total,
        runtimeMs: totalMs,
        testResults: cases,
        completedAt: new Date(),
      });
      await sessionStore.set(sessionId, { submissionId: submission._id, status: 'completed', language: lang, result: { status: 'completed', testsPassed: passed, totalTests: total, runtime: `${totalMs}ms`, testResults: cases }, completedAt: Date.now() });
      emit('compiler:session:update', { sessionId, status: 'completed', language: lang, testsPassed: passed, totalTests: total, runtime: `${totalMs}ms`, testResults: cases });
      const doc = await Submission.findById(submission._id).select('user');
      if (doc?.user) emitToUser(doc.user, 'compiler:submission:update', { submissionId: submission._id, status });
      endBatch();
      increment('exec_batch_success', 1);
    } catch (e) {
      const errMsg = e?.message || 'Batch execution failed';
      await Submission.findByIdAndUpdate(submission._id, { status: 'Server Error', error: errMsg, completedAt: new Date() });
      await sessionStore.set(sessionId, { submissionId: submission._id, status: 'error', language: lang, result: { status: 'error', error: errMsg } });
      emit('compiler:session:update', { sessionId, status: 'error', language: lang, error: errMsg });
      increment('exec_batch_error', 1);
    }
  })();

  return { submissionId: submission._id, sessionId };
}

export default {
  executeCode,
  getExecutionResult,
  submitCode,
  submitCodeBatch,
};
