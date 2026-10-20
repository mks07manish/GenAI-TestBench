
import { test, expect } from '@playwright/test';

const API_URL = '/api/ask';

test('API-001: Valid question returns expected response structure',
  async ({ request }) => {
    const response = await request.post(API_URL, {
      data: {
        question: 'How many annual leave days do employees receive?',
        top_k: 3
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(typeof body.answer).toBe('string');
    expect(body.answer.length).toBeGreaterThan(0);

    expect(Array.isArray(body.retrievedChunks)).toBeTruthy();
    expect(body.evaluation).toBeTruthy();

    expect(typeof body.evaluation.faithfulness).toBe('number');
    expect(typeof body.evaluation.answer_relevance).toBe('number');
  }
);

test('API-002: Missing question is rejected', async ({ request }) => {
  const response = await request.post(API_URL, {
    data: { top_k: 3 }
  });

  expect(response.status()).toBe(422);
});

test('API-003: Empty question is rejected', async ({ request }) => {
  const response = await request.post(API_URL, {
    data: { question: '   ', top_k: 3 }
  });

  expect(response.status()).toBe(422);
});

test('API-004: Invalid top_k is rejected', async ({ request }) => {
  const response = await request.post(API_URL, {
    data: {
      question: 'Explain the leave policy',
      top_k: 0
    }
  });

  expect(response.status()).toBe(422);
});

test('API-005: Malformed JSON is rejected', async ({ request }) => {
  const response = await request.post(API_URL, {
    headers: {
      'Content-Type': 'application/json'
    },
    data: '{"question": '
  });

  expect(response.status()).toBe(422);
});
