import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { logger } from '../utils/logger';
/**
 * A test component to verify that environment variables are being loaded correctly
 */
const EnvTest = () => {
    logger.debug('EnvTest component rendered');
    // Check different environment variable sources
    const envSources = {
        'import.meta.env.VITE_API_URL': import.meta.env?.VITE_API_URL || 'Not available',
        'window.env?.REACT_APP_API_URL': window.env?.REACT_APP_API_URL || 'Not available',
        'window.env object exists': typeof window.env !== 'undefined' ? 'Yes' : 'No',
        'import.meta.env object exists': typeof import.meta.env !== 'undefined' ? 'Yes' : 'No'
    };
    return (_jsxs("div", { className: "env-test", style: {
            margin: '20px',
            padding: '20px',
            border: '1px solid var(--border-color, #ddd)',
            borderRadius: '5px',
            backgroundColor: 'var(--card-background, white)',
            color: 'var(--text-color, #333)'
        }, children: [_jsx("h2", { style: { color: 'var(--heading-color, #333)' }, children: "Environment Variables Test" }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("p", { children: "This component helps verify if environment variables are loaded correctly." }), _jsxs("p", { children: [_jsx("strong", { children: "Note:" }), " This component helps verify environment configuration."] })] }), _jsxs("div", { children: [_jsx("h3", { style: { color: 'var(--heading-color, #444)' }, children: "Environment Variable Sources" }), _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: {
                                                border: '1px solid var(--border-color, #ddd)',
                                                padding: '8px',
                                                textAlign: 'left',
                                                backgroundColor: 'var(--table-header-bg, #f5f5f5)',
                                                color: 'var(--text-color, #333)'
                                            }, children: "Source" }), _jsx("th", { style: {
                                                border: '1px solid var(--border-color, #ddd)',
                                                padding: '8px',
                                                textAlign: 'left',
                                                backgroundColor: 'var(--table-header-bg, #f5f5f5)',
                                                color: 'var(--text-color, #333)'
                                            }, children: "Value" })] }) }), _jsx("tbody", { children: Object.entries(envSources).map(([source, value]) => (_jsxs("tr", { children: [_jsx("td", { style: {
                                                border: '1px solid var(--border-color, #ddd)',
                                                padding: '8px',
                                                backgroundColor: 'var(--table-cell-bg, transparent)'
                                            }, children: source }), _jsx("td", { style: {
                                                border: '1px solid var(--border-color, #ddd)',
                                                padding: '8px',
                                                backgroundColor: 'var(--table-cell-bg, transparent)'
                                            }, children: value })] }, source))) })] })] })] }));
};
export default EnvTest;
