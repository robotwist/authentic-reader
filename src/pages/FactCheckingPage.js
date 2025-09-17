import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import FactCheckingAssistant from '../components/FactCheckingAssistant';
import '../styles/FactCheckingPage.css';
const FactCheckingPage = () => {
    const navigate = useNavigate();
    const handleFactCheckComplete = (result) => {
        console.log('Fact check completed:', result);
        // You could save the results, show notifications, etc.
    };
    return (_jsxs("div", { className: "fact-checking-page", children: [_jsx("div", { className: "page-header", children: _jsxs("button", { onClick: () => navigate('/'), className: "back-button", children: [_jsx(FiArrowLeft, {}), " Back to Home"] }) }), _jsx(FactCheckingAssistant, { onFactCheckComplete: handleFactCheckComplete })] }));
};
export default FactCheckingPage;
