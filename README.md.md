# GenAI-TestBench

An automated quality engineering framework for validating LLM-powered
applications and Retrieval-Augmented Generation (RAG) systems. It
combines API, retrieval, LLM behavior, and security checks in a
Playwright-based test suite, using local Ollama models for model
interactions.

## Highlights

-   30 automated tests across RAG, LLM behavior, API functionality, and
    security.
-   RAG evaluation utilities for Precision@K, Recall@K, Hit Rate@K, and
    Mean Reciprocal Rank (MRR).
-   LLM behavior checks for grounding, instruction following, response
    quality, reliability, safety, and scoring.
-   Custom Playwright JSON reporting with overall and category-level
    summaries.
-   Local model execution through Ollama.

The latest recorded run passed all 30 tests (100% pass rate). Results
depend on the local environment, model version, test data, and
application state; this does not guarantee production readiness.

## Technology stack

  Area                  Technologies
  --------------------- ------------------------------------------
  Test automation       Playwright Test, JavaScript (ES modules)
  RAG application       Python, FastAPI
  Vector storage        ChromaDB
  Local model runtime   Ollama
  Chat model            `llama3.2:3b`
  Embedding model       `embeddinggemma`
  Reporting             Custom Playwright JSON reporter

## Project structure

``` text
GenAI-TestBench/
├── app/                         # FastAPI RAG application
│   ├── main.py
│   ├── config.py
│   ├── ollama_client.py
│   ├── store.py
│   └── ingest.py
├── data/
│   └── llm-test-cases.js
├── evaluation/
│   ├── metrics.py
│   └── judge.py
├── test-data/                   # RAG fixtures/documents
├── tests/
│   ├── api-functional.spec.js
│   ├── rag.spec.js
│   ├── security.spec.js
│   ├── llm-grounding.spec.js
│   ├── llm-instruction.spec.js
│   ├── llm-metrics.spec.js
│   ├── llm-quality.spec.js
│   ├── llm-reliability.spec.js
│   ├── llm-response.spec.js
│   ├── llm-safety.spec.js
│   └── llm-scoring.spec.js
├── utils/
│   ├── llm-metrics.js
│   ├── ollama-client.js
│   └── response-evaluator.js
├── reports/
│   └── rag-json-reporter.js
├── .env.example
├── package.json
├── playwright.config.js
└── requirements.txt
```

## Prerequisites

Install Node.js/npm, Python, and Ollama. Confirm the required local
models are available:

``` powershell
ollama list
```

If needed:

``` powershell
ollama pull llama3.2:3b
ollama pull embeddinggemma
```

Ensure Ollama is running at `http://127.0.0.1:11434`.

## Setup

Run commands from the project root, `C:\Projects\GenAI-TestBench`.

### 1. Configure environment

``` powershell
Copy-Item .env.example .env
```

Review `.env`:

``` dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
RAG_BASE_URL=http://127.0.0.1:8000
```

Do not commit `.env` or place secrets in it.

### 2. Install JavaScript dependencies

``` powershell
npm.cmd install
npm.cmd run test:list
```

### 3. Install Python dependencies

``` powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Start the RAG API

``` powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` to inspect the FastAPI endpoints.
Before testing, make sure the expected documents have been ingested into
the vector store. Follow the ingestion procedure implemented in
`app/main.py` and `app/ingest.py`; verify the exact route in your code
rather than assuming a fixed endpoint.

Keep the API terminal open. In a second terminal, run the tests.

## Run tests

``` powershell
npm.cmd test
```

List tests without executing them:

``` powershell
npm.cmd run test:list
```

The full suite expects both the RAG API and Ollama to be reachable.

## Test coverage

  ------------------------------------------------------------------------
  Category                                     Tests Focus
  --------------------- ---------------------------- ---------------------
  RAG                                              5 Retrieval behavior,
                                                     grounding, and RAG
                                                     scenarios

  LLM                                             17 Grounding,
                                                     instructions,
                                                     metrics, quality,
                                                     reliability,
                                                     responses, safety,
                                                     scoring

  API                                              5 API functional
                                                     behavior

  Security                                         3 Selected security and
                                                     adversarial-input
                                                     scenarios

  **Total**                                   **30** **Unified GenAI test
                                                     suite**
  ------------------------------------------------------------------------

Counts reflect the latest recorded run and may change as the suite
evolves.

## RAG evaluation metrics

-   **Precision@K:** proportion of the top-K retrieved results that are
    relevant.
-   **Recall@K:** proportion of all known relevant results retrieved in
    the top K.
-   **Hit Rate@K:** whether at least one relevant result appears in the
    top K.
-   **MRR:** average reciprocal rank of the first relevant result.

Retrieval metrics do not, by themselves, prove that a generated answer
is correct, complete, or safe. Answer-level evaluation and targeted test
cases are also necessary.

## JSON report

The custom reporter writes:

``` text
reports/genai-test-report.json
```

The report includes the overall run status, discovered/executed test
counts, pass/fail/skip/interruption counts, pass rate, category
summaries, and per-test status, duration, retry count, metrics, and
error details when available.

The JSON report is generated output and should normally stay out of
version control. Commit the reporter source,
`reports/rag-json-reporter.js`.

## Troubleshooting

### Ollama connection errors

-   Verify Ollama is running.
-   Check `OLLAMA_BASE_URL` in `.env`.
-   Run `ollama list` and confirm the configured models are installed.

### RAG tests fail or retrieve no relevant documents

-   Verify the API is running at `RAG_BASE_URL`.
-   Inspect `http://127.0.0.1:8000/docs`.
-   Ensure the expected documents have been ingested and the vector
    store contains data.
-   Review the failing assertion, fixtures, and retrieval metrics.

### Report shows zero tests after listing

A test-listing command does not execute tests. Run `npm.cmd test` to
generate a report for executed tests.

## Git hygiene

Keep these out of version control: `.env`, `node_modules/`, `.venv/`,
Python cache files, Playwright temporary output, generated reports, and
local ChromaDB data. Commit `.env.example`, source code, test cases,
evaluation utilities, and the custom reporter. Never commit secrets or
private test data.

## Current status and limitations

-   Latest recorded run: **30 passed, 0 failed, 0 skipped; 100% pass
    rate**.
-   Tests run against a local development environment and local Ollama
    models.
-   Model outputs can vary by model version, prompt, hardware, and
    runtime configuration.
-   This is a portfolio/learning project. Production use would need
    broader datasets, repeatability controls, deeper security coverage,
    CI execution, and documented acceptance thresholds.

## Suggested future improvements

1.  Add CI execution and publish reports as build artifacts.
2.  Define threshold-based gates for retrieval and answer-quality
    metrics.
3.  Expand prompt-injection, sensitive-data, adversarial, and refusal
    tests.
4.  Record model and embedding versions in each report.
5.  Add repeat-run analysis for nondeterministic failures.
6.  Document representative datasets and evaluation thresholds.

## License

Choose and add a license before publishing if you want others to reuse
the project. Do not imply an open-source license until you have selected
one.
