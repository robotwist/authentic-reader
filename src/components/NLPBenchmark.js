import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { runBenchmark, formatBenchmarkResults, getNLPServiceHealth } from '../utils/benchmarkUtils';
import '../styles/NLPBenchmark.css'; // We'll create this file next
const SAMPLE_TEXT = `
The recent developments in artificial intelligence have sparked debates about ethics and governance. 
Companies like OpenAI, Google, and Microsoft are investing billions in research and development.
Meanwhile, politicians in Washington D.C. and Brussels are drafting regulations to address concerns 
about privacy, bias, and the potential impact on jobs. The rapid advancement of large language models 
has surprised even experts in the field, with capabilities improving at an unprecedented rate.
`;
const NLPBenchmark = () => {
    const [results, setResults] = useState(null);
    const [formattedResults, setFormattedResults] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [text, setText] = useState(SAMPLE_TEXT);
    const [labels, setLabels] = useState('technology, politics, ethics, business');
    const handleRunBenchmark = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Check service health first
            const health = await getNLPServiceHealth();
            setServiceStatus(health);
            if (health.status !== 'healthy' && health.status !== 'degraded') {
                throw new Error('NLP service is not available');
            }
            // Run the benchmark
            const labelArray = labels.split(',').map(l => l.trim()).filter(l => l);
            const benchmarkResults = await runBenchmark(text, labelArray);
            // Format and display results
            setResults(benchmarkResults);
            setFormattedResults(formatBenchmarkResults(benchmarkResults));
        }
        catch (err) {
            setError(err.message || 'Failed to run benchmark');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "nlp-benchmark", children: [_jsx("h2", { children: "NLP Performance Benchmark" }), _jsx("p", { children: "Compare the performance of Hugging Face models with ONNX Runtime optimized versions." }), serviceStatus && (_jsxs("div", { className: `service-status status-${serviceStatus.status}`, children: [_jsxs("h3", { children: ["NLP Service Status: ", serviceStatus.status] }), serviceStatus.zero_shot_model && (_jsxs("div", { children: [_jsxs("p", { children: ["Zero-Shot Model: ", serviceStatus.zero_shot_model.name] }), _jsxs("p", { children: ["Using ONNX: ", serviceStatus.zero_shot_model.using_onnx ? 'Yes' : 'No'] })] })), serviceStatus.ner_model && (_jsxs("div", { children: [_jsxs("p", { children: ["NER Model: ", serviceStatus.ner_model.name] }), _jsxs("p", { children: ["Using ONNX: ", serviceStatus.ner_model.using_onnx ? 'Yes' : 'No'] })] }))] })), _jsxs("div", { className: "benchmark-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "benchmark-text", children: "Text to analyze:" }), _jsx("textarea", { id: "benchmark-text", value: text, onChange: (e) => setText(e.target.value), rows: 6 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "benchmark-labels", children: "Labels (comma-separated):" }), _jsx("input", { type: "text", id: "benchmark-labels", value: labels, onChange: (e) => setLabels(e.target.value) })] }), _jsx("button", { onClick: handleRunBenchmark, disabled: isLoading || !text.trim(), className: "benchmark-button", children: isLoading ? 'Running Benchmark...' : 'Run Benchmark' })] }), error && (_jsx("div", { className: "error-message", children: _jsx("p", { children: error }) })), formattedResults && (_jsxs("div", { className: "benchmark-results", children: [_jsx("div", { className: "markdown-container", children: _jsx("pre", { children: formattedResults }) }), results && results.zero_shot.speedup && results.ner.speedup && (_jsxs("div", { className: "summary", children: [_jsx("h3", { children: "Summary" }), _jsxs("p", { children: ["ONNX Runtime provides a ", Math.round((results.zero_shot.speedup + results.ner.speedup) / 2 * 100) / 100, "x average speedup across all models, demonstrating significant performance improvements for production deployments."] })] }))] }))] }));
};
export default NLPBenchmark;
