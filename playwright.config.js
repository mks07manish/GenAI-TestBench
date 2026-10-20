import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 150000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    [
      './reports/rag-json-reporter.js',
      {
        outputFile: 'reports/genai-test-report.json'
      }
    ]
  ],
  use: {
    baseURL: process.env.RAG_BASE_URL || 'http://127.0.0.1:8000'
  }
});
