#!/usr/bin/env node
/*
  Migration helper to:
  1) Seed IO-ready starterCode templates for problems missing them
  2) Set comparisonMode (strict|relaxed) at problem-level

  Usage examples:
  - Seed starters for all problems that don't have them:
      node scripts/seedStartersAndComparison.js --seed-starters

  - Set comparisonMode=strict for a specific problem id:
      node scripts/seedStartersAndComparison.js --set-mode strict --problem <problemId>

  - Set comparisonMode=relaxed for ALL problems:
      node scripts/seedStartersAndComparison.js --set-mode relaxed --all

  Requirements:
  - server/.env must contain MONGODB_URI
*/

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Dynamically import Problem model
const problemModelPath = path.join(__dirname, '..', 'models', 'Problem.js');
if (!fs.existsSync(problemModelPath)) {
  console.error('Cannot find models/Problem.js. Please ensure the Problem model exists.');
  process.exit(1);
}
const { default: Problem } = await import(problemModelPath);

const argv = process.argv.slice(2);
const hasFlag = (flag) => argv.includes(flag);
const getValue = (flag, def) => {
  const i = argv.indexOf(flag);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return def;
};

const SHOULD_SEED_STARTERS = hasFlag('--seed-starters');
const SET_MODE = hasFlag('--set-mode') ? (getValue('--set-mode', 'relaxed') || 'relaxed') : null; // strict|relaxed
const TARGET_PROBLEM = getValue('--problem');
const AFFECT_ALL = hasFlag('--all');

// IO-ready starter templates matching client/src/pages/ProblemDetail.tsx getDefaultCode()
const starterTemplates = {
  javascript: `// Read stdin line-by-line with readLine() and print one result per line\nfunction solveOne(line) {\n  // TODO: implement per-line solution\n  return line;\n}\n\n(function main(){\n  const out = [];\n  for(;;){\n    const line = readLine();\n    if (line === '') break; // end of input in this sandbox\n    out.push(solveOne(line));\n  }\n  console.log(out.join('\\n'));\n})();`,
  python: `# Read stdin lines and print one result per line\nimport sys\n\ndef solve_one(s: str) -> str:\n    # TODO: implement per-line solution\n    return s\n\ndef main():\n    lines = sys.stdin.read().splitlines()\n    out = [solve_one(line) for line in lines]\n    sys.stdout.write("\\n".join(out))\n\nif __name__ == '__main__':\n    main()`,
  java: `import java.io.*;\nimport java.util.*;\n\npublic class Solution {\n    static String solveOne(String s) {\n        // TODO: implement per-line solution\n        return s;\n    }\n\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        String line;\n        boolean first = true;\n        StringBuilder out = new StringBuilder();\n        while ((line = br.readLine()) != null) {\n            if (!first) out.append('\\n');\n            first = false;\n            out.append(solveOne(line));\n        }\n        System.out.print(out.toString());\n    }\n}`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstring solveOne(const string& s){\n    // TODO: implement per-line solution\n    return s;\n}\n\nint main(){\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string line; bool first = true;\n    while (getline(cin, line)){\n        if (!first) cout << '\\n';\n        first = false;\n        cout << solveOne(line);\n    }\n    return 0;\n}`,
};

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const criteria = TARGET_PROBLEM && !AFFECT_ALL ? { _id: TARGET_PROBLEM } : {};

  if (SHOULD_SEED_STARTERS) {
    const problems = await Problem.find(criteria);
    let updated = 0;
    for (const p of problems) {
      p.starterCode = p.starterCode || {};
      let changed = false;
      for (const lang of ['javascript', 'python', 'java', 'cpp']) {
        if (!p.starterCode[lang]) {
          p.starterCode[lang] = starterTemplates[lang];
          changed = true;
        }
      }
      if (changed) {
        await p.save();
        updated++;
      }
    }
    console.log(`Seeded starterCode for ${updated} problem(s).`);
  }

  if (SET_MODE) {
    const mode = (SET_MODE || 'relaxed').toLowerCase() === 'strict' ? 'strict' : 'relaxed';
    const update = {
      $set: {
        comparisonMode: mode,
        'settings.comparison': mode,
      },
    };
    const res = await Problem.updateMany(criteria, update);
    console.log(`Set comparisonMode='${mode}' for ${res.modifiedCount || res.nModified || 0} problem(s).`);
  }

  await mongoose.disconnect();
};

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
