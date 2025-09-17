import axios from "axios";
import { LANGUAGE_VERSIONS } from "./constants";

// Always use your backend executor
const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EXEC_BASE = rawBase.replace(/\/$/, "");
const EXEC_PATH = import.meta.env.VITE_EXECUTE_PATH || "/api/execute";

const API = axios.create({
  baseURL: EXEC_BASE,
});

export async function executeCode(language: string, sourceCode: string, stdin?: string): Promise<any> {
  const response = await API.post(EXEC_PATH, {
    language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
    ...(stdin ? { stdin } : {}),
  });
  return response.data;
}
