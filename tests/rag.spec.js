
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const cases = JSON.parse(
  fs.readFileSync('test-data/rag-evaluation-dataset.json', 'utf8')
);

function calculateRetrievalRelevance(chunks, keywords) {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  const retrievedText = chunks
    .map(chunk => chunk.text || '')
    .join(' ')
    .toLowerCase();

  const matchedKeywords = keywords.filter(keyword =>
    retrievedText.includes(keyword.toLowerCase())
  );

  return {
    score: matchedKeywords.length / keywords.length,
    matchedKeywords,
    missingKeywords: keywords.filter(
      keyword => !matchedKeywords.includes(keyword)
    )
  };
}

test('API is healthy and documents are indexed', async ({ request }) => {
  const health = await request.get('/health');
  expect(health.ok()).toBeTruthy();
  expect((await health.json()).status).toBe('ok');

  const infoResponse = await request.get('/api/collection');
  expect(infoResponse.ok()).toBeTruthy();
  expect((await infoResponse.json()).chunk_count).toBeGreaterThan(0);
});


for (const item of cases) {
  test(`${item.id}: ${item.question}`, async ({ request }, testInfo) => {
    const response = await request.post('/api/ask', {
      data: {
        question: item.question,
        top_k: 3
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.answer).toBeTruthy();
    expect(result.retrievedChunks.length).toBeGreaterThan(0);

    // Handle unanswerable questions separately.
    if (item.expected_behavior === 'abstain') {
      await testInfo.attach('rag-metrics', {
        body: Buffer.from(JSON.stringify({
          expectedBehavior: 'abstain',
          retrievedChunkCount: result.retrievedChunks.length
        })),
        contentType: 'application/json'
      });

      expect(result.answer).toMatch(
        /not contain|not enough information|cannot find|unable to determine|no information|no retrieved document|does not cover|don't have information|doesn't have information/i
      );  

      return;
    }

    // Evaluate retrieval only for answerable questions.
    const retrieval = calculateRetrievalRelevance(
      result.retrievedChunks,
      item.relevant_keywords
    );

    expect(retrieval).not.toBeNull();

    await testInfo.attach('rag-metrics', {
      body: Buffer.from(JSON.stringify({
        expectedBehavior: 'answer',
        retrievalRelevance: retrieval.score,
        matchedKeywords: retrieval.matchedKeywords,
        missingKeywords: retrieval.missingKeywords,
        faithfulness: result.evaluation.faithfulness,
        answerRelevance: result.evaluation.answer_relevance,
        retrievedChunkCount: result.retrievedChunks.length
      })),
      contentType: 'application/json'
    });

    expect(retrieval.score).toBeGreaterThanOrEqual(
      item.min_retrieval_relevance
    );

    expect(result.evaluation.faithfulness)
      .toBeGreaterThanOrEqual(item.min_faithfulness);

    expect(result.evaluation.answer_relevance)
      .toBeGreaterThanOrEqual(item.min_answer_relevance);
  });
}
