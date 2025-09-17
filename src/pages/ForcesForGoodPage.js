import { jsx as _jsx } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import ForcesForGood from '../components/ForcesForGood';
import { logger } from '../utils/logger';
import './ForcesForGoodPage.css';
const ForcesForGoodPage = () => {
    const navigate = useNavigate();
    const handleArticleSelect = (article) => {
        // Navigate to the article reader with exemplary article data
        // For now, we'll create a special route for exemplary articles
        navigate(`/exemplary-article/${article.id}`);
        logger.info('Exemplary article selected for reading', {
            articleId: article.id,
            source: article.source.name
        });
    };
    return (_jsx("div", { className: "forces-for-good-page", children: _jsx(ForcesForGood, { onArticleSelect: handleArticleSelect }) }));
};
export default ForcesForGoodPage;
