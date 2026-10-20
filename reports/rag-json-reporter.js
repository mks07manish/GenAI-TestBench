import fs from 'node:fs';
import path from 'node:path';

class GenAIJsonReporter {
    constructor(options = {}) {
        this.outputFile =
            options.outputFile || 'reports/genai-test-report.json';

        this.results = [];
        this.startTime = 0;
        this.totalTests = 0;
    }

    onBegin(config, suite) {
        this.startTime = Date.now();
        this.totalTests = suite.allTests().length;
    }

    async onTestEnd(test, result) {
        let metrics = {};

        const attachment = result.attachments.find(
            item => item.name === 'rag-metrics'
        );

        if (attachment) {
            try {
                let content;

                if (attachment.body) {
                    content = attachment.body.toString('utf8');
                } else if (attachment.path) {
                    content = await fs.promises.readFile(
                        attachment.path,
                        'utf8'
                    );
                }

                if (content) {
                    metrics = JSON.parse(content);
                }
            } catch (error) {
                metrics = { metricsReadError: error.message };
            }
        }

        const errors = result.errors.map(error => ({
            message: error.message || 'Unknown test error',
            stack: error.stack || null
        }));

        const file = test.location.file.replaceAll('\\', '/');
        const explicitId =
            test.title.match(/\b(?:RAG|API|SEC)-\d+\b/i)?.[0]?.toUpperCase();

        let category = 'OTHER';

        if (explicitId?.startsWith('RAG-') || /\/rag\.spec\.js$/i.test(file)) {
            category = 'RAG';
        } else if (explicitId?.startsWith('API-') || /\/api-functional\.spec\.js$/i.test(file)) {
            category = 'API';
        } else if (explicitId?.startsWith('SEC-') || /\/security\.spec\.js$/i.test(file)) {
            category = 'SEC';
        } else if (/\/llm-(grounding|instruction|metrics|quality|reliability|response|safety|scoring)\.spec\.js$/i.test(file)) {
            category = 'LLM';
        }

        this.results.push({
            testId: explicitId || `AUTO-${test.location.line}`,
            category,
            title: test.title,
            file: test.location.file,
            line: test.location.line,
            status: result.status,
            durationMs: result.duration,
            retry: result.retry,
            metrics,
            errors
        });
    }

    async onEnd(result) {
        const count = status =>
            this.results.filter(item => item.status === status).length;

        const passed = count('passed');
        const failed = count('failed');
        const skipped = count('skipped');
        const interrupted = count('interrupted');

        const categories = ['RAG', 'LLM', 'API', 'SEC', 'OTHER'];

        const categorySummary = Object.fromEntries(
            categories.map(category => {
                const tests = this.results.filter(
                    item => item.category === category
                );
                const categoryPassed = tests.filter(
                    item => item.status === 'passed'
                ).length;

                return [
                    category,
                    {
                        total: tests.length,
                        passed: categoryPassed,
                        failed: tests.filter(item => item.status === 'failed').length,
                        skipped: tests.filter(item => item.status === 'skipped').length,
                        interrupted: tests.filter(item => item.status === 'interrupted').length,
                        passRate: tests.length
                            ? Number(((categoryPassed / tests.length) * 100).toFixed(2))
                            : 0
                    }
                ];
            })
        );

        const report = {
            project: 'GenAI-TestBench',
            generatedAt: new Date().toISOString(),
            durationMs: Date.now() - this.startTime,
            summary: {
                discovered: this.totalTests,
                total: this.results.length,
                passed,
                failed,
                skipped,
                interrupted,
                passRate: this.results.length
                    ? Number(((passed / this.results.length) * 100).toFixed(2))
                    : 0,
                playwrightRunStatus: result.status
            },
            categorySummary,
            tests: this.results
        };

        const outputPath = path.resolve(this.outputFile);

        await fs.promises.mkdir(path.dirname(outputPath), {
            recursive: true
        });

        await fs.promises.writeFile(
            outputPath,
            JSON.stringify(report, null, 2),
            'utf8'
        );

        console.log(`\nGenAI-TestBench JSON report saved: ${outputPath}`);
        console.log(
            `Total: ${report.summary.total} | ` +
            `Passed: ${passed} | Failed: ${failed} | ` +
            `Skipped: ${skipped} | Interrupted: ${interrupted}`
        );
    }
}

export default GenAIJsonReporter;
