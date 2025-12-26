# Deletion Proposal for Sole Purpose Refactoring

## ✅ Dependency Check
- `dompurify` and `@types/dompurify` are already installed ✓

## 📋 Files to Delete

### Frontend Components (src/components/)
- `AnalysisTooltip.tsx` - Complex tooltip system, not needed for ReaderView
- `ArticleAnalysis.tsx` - Multi-tab analysis (bias, metrics, manipulation, emotions) - too complex, ReaderView replaces this
- `ArticleParser.tsx` - Complex passage splitting, not needed (backend handles extraction)
- `ui/Badge.tsx` - Unused UI component
- `admin/` - Entire admin directory (empty but should be removed)

### Frontend Pages (src/pages/)
- `ArticleReaderPage.tsx` - Old reader page, replaced by ReaderView in AnalysisPage
- `ArticleReaderPage.css` - Styles for deleted page

### Frontend Styles (src/styles/)
Delete ALL unused CSS files (keep only what's actively used):
- `AboutPage.css`
- `AdminDashboard.css`
- `AgenticAIDashboard.css`
- `AIAgentOrchestrator.css`
- `AIAgentOrchestratorPage.css`
- `AnalysisTest.css`
- `AnalysisTooltip.css`
- `AnalyticsDashboard.css`
- `AnnotationSystem.css`
- `ArticleAnalysis.css` - Replaced by ReaderView.css
- `ArticleAnalysisPage.css`
- `ArticleCard.css`
- `ArticleFeedPage.css`
- `ArticleGeneratorPage.css`
- `ArticleImporter.css`
- `ArticlePage.css`
- `Auth.css`
- `AutonomousLearningAgent.css`
- `AutonomousLearningPage.css`
- `BalancedFeedPage.css`
- `BiasDetection.css`
- `CollaborativeAINetwork.css`
- `CollaborativeAINetworkPage.css`
- `ComparativeAnalysis.css`
- `ComparativeAnalysisPage.css`
- `DarkPatternDetection.css`
- `DynamicArticleGenerator.css`
- `EmotionAnalysis.css`
- `EnhancedArticleAnalysis.css`
- `EnhancedArticleView.css`
- `EnhancedBiasDetection.css`
- `EntityRelationship.css`
- `FactCheckingAssistant.css`
- `FactCheckingPage.css`
- `FeedContainer.css`
- `FilterPanel.css`
- `InteractiveArticleView.css`
- `JournalistRating.css`
- `LibraryPage.css`
- `ManipulationAnalysis.css`
- `MediaLiteracyGuide.css`
- `NetworkAnalysis.css`
- `NLPAnalysisDisplay.css`
- `NLPBenchmark.css`
- `PoliticalAnalysisPage.css`
- `PoliticalOrientationChart.css`
- `Profile.css`
- `PWAInstallBanner.css`
- `RhetoricalAnalysis.css`
- `SearchSortBar.css`
- `SentimentAnalysisDashboard.css`
- `SentimentAnalysisPage.css`
- `SettingsPage.css`
- `SourceCredibilityDashboard.css`
- `SubjectGuide.css`
- `Summarizer.css`
- `TextOverlayHighlighter.css`

Keep:
- `HomePage.css` - Used by HomePage
- `AnalysisPage.css` - Used by AnalysisPage
- `Header.css` - Used by Header component
- `SkipLinks.css` - Used by SkipLinks component

### Frontend Contexts
- `contexts/ThemeContext.tsx` - Theme switching not needed for sole purpose

### Backend - Authentication & User Management
- `authentic-reader-backend/controllers/userController.js`
- `authentic-reader-backend/controllers/adminController.js`
- `authentic-reader-backend/middleware/auth.js`
- `authentic-reader-backend/models/user.js`
- `authentic-reader-backend/models/userPrefs.js` (if exists)
- `authentic-reader-backend/routes/userRoutes.js` (or similar)
- `authentic-reader-backend/routes/adminRoutes.js` (or similar)
- `authentic-reader-backend/ADMIN.md`
- `authentic-reader-backend/create-admin.js`
- `authentic-reader-backend/create-and-test-admin.js`
- `authentic-reader-backend/create-new-admin-copy.js`
- `authentic-reader-backend/create-new-admin.js`
- `authentic-reader-backend/create-simple-admin.js`
- `authentic-reader-backend/create-user.js`
- `authentic-reader-backend/debug-login.js`
- `authentic-reader-backend/subscribe-admin.js`
- `authentic-reader-backend/subscribe-admin2.js`
- `authentic-reader-backend/subscribe-seeded-admin.js`
- `authentic-reader-backend/utils/userMaintenance.js` (if exists)

### Backend - Collaboration & Social Features
- `authentic-reader-backend/services/collaborationService.js`
- `authentic-reader-backend/routes/collaborationRoutes.js` (if exists)
- Any annotation-related routes/models

### Backend - Database Migrations (User/Auth Related)
- `authentic-reader-backend/migrations/*` - Review and delete user/auth related migrations
- `authentic-reader-backend/db/migrations/004_add_collaboration_features.sql`

### Backend - Seeders (User/Auth Related)
- `authentic-reader-backend/seeders/admin-seed.js` (if exists)
- `seeders/admin-seed.js`

### Root Level - Old Backend Files
- `controllers/analysisController.js` - Check if used, may have sharing features
- `controllers/articleController.js` - Check if used
- `routes/admin/` - Entire admin routes directory
- `routes/aiAnalysis.js` - Check if used
- `routes/analysis.js` - Check if used
- `routes/article.js` - Check if used
- `db/annotations_schema.sql` - Collaboration feature
- `db/migrations/` - Review and delete non-essential migrations
- `db/setup-db.js` - If it's for user/auth setup
- `middleware/rateLimit.js` - Check if needed (may be needed for API protection)
- `models/onnx/` - ONNX model files (if not used for LLM)

### Services (Root Level)
- `services/contentExtractionService.js` - Check if used by backend
- `services/productionAIService.js` - Check if used

### Scripts (Root Level)
- `scripts/check-tokens.js` - Auth related
- `scripts/rotate-token.js` - Auth related
- `scripts/setup-stockpile-database.js` - Not needed
- `scripts/test-stockpile-system.js` - Not needed
- `scripts/deploy-heroku.js` - Keep if needed for deployment
- `scripts/deploy-netlify.js` - Keep if needed for deployment
- `scripts/deploy.js` - Keep if needed for deployment
- `scripts/setup-railway-backend.sh` - Keep if needed for deployment
- Other deployment scripts - Review individually

### Documentation
- `AUDIT_REPORT.md` - Audit complete, can delete
- `CLEANUP_PLAN.md` - Cleanup complete, can delete
- `CLEANUP_SUMMARY.md` - Summary complete, can delete
- `ESLINT-GUIDE.md` - Not essential
- `eslint-report.html` - Generated file
- `authentic-reader-backend/ESLINT-GUIDE.md`
- `authentic-reader-backend/eslint-report.html`
- `authentic-reader-backend/RAILWAY_DEPLOYMENT.md` - Keep if deploying to Railway
- `docs/monitoring-guide.md` - Not essential for sole purpose

### Test Files
- `__tests__/analysis.integration.test.js` - Review if tests are still valid
- `__tests__/articles.integration.test.js` - Review if tests are still valid
- `e2e/user-journey.spec.ts` - Review if still relevant
- `src/components/__tests__/SkipLinks.test.tsx` - Keep (accessibility)

### Other
- `bfg.jar` - Git history cleaner, not needed
- `chroma_data/` - ChromaDB data (if not used)
- `chroma_db/` - ChromaDB data (if not used)
- `chroma_output.log` - Log file
- `chroma.log` - Log file
- `test_output.txt` - Test output
- `test_suite_analysis/` - Test data
- `token.json` - Auth token (should be in .gitignore)
- `venv/` - Python virtualenv (should be in .gitignore)
- `llama-service/` - Keep if this is your LLM service
- `nlp-service/` - Review if used
- `managed_context/` - Review if used

## 📝 New README.md (3 Sentences)

```markdown
# Logical Fallacy Analyzer

A React application that fetches articles from URLs or RSS feeds, uses an LLM to identify logical fallacies in the text, and displays them in a calm reading interface with contextual highlights. The app helps readers identify rhetorical manipulation by providing detailed explanations of how, why, and for what purpose each fallacy was used. Simply enter an article URL, and the app will analyze the content and highlight fallacies inline as you read.
```

## ⚠️ Notes

1. **Backend Services**: Keep `authentic-reader-backend/services/enhancedAIAnalysisService.js` if it handles LLM integration for fallacy detection
2. **Article Fetching**: Keep RSS/article fetching services in backend
3. **ReaderView**: This is the new component that replaces ArticleAnalysis
4. **AnalysisPage**: Should be updated to use ReaderView instead of the old analysis display

