# Detailed Cleanup & Refactoring Plan

This document provides a detailed execution plan for removing all non-essential features and refactoring to the sole purpose.

## Phase 1: Documentation Updates ✅

- [x] Create AUDIT_REPORT.md
- [x] Create new README.md
- [x] Create CLEANUP_PLAN.md
- [ ] Delete obsolete documentation files

## Phase 2: Frontend Component Deletion

### Components to Delete Entirely

```
src/components/
├── AdminDashboard.tsx ❌
├── AgenticAIDashboard.tsx ❌
├── AIAgentOrchestrator.tsx ❌
├── AnalysisTest.tsx ❌
├── AnalyticsDashboard.tsx ❌
├── AnnotationSystem.tsx ❌
├── ArticleCard.tsx ❌
├── ArticleImporter.tsx ❌
├── AutonomousLearningAgent.tsx ❌
├── BiasDetection.tsx ❌
├── BiasTagger.tsx ❌
├── CollaborativeAINetwork.tsx ❌
├── CommunityArticleReader.tsx ❌
├── ComparativeAnalysis.tsx ❌
├── DarkPatternDetection.tsx ❌
├── DynamicArticleGenerator.tsx ❌
├── EmotionAnalysis.tsx ❌
├── EnhancedArticleView.tsx ❌
├── EnhancedBiasDetection.tsx ❌
├── EnhancedArticleAnalysis.tsx ❌
├── EntityRelationship.tsx ❌
├── EnvTest.tsx ❌
├── FactCheckingAssistant.tsx ❌
├── FeedbackDashboard.tsx ❌
├── FeedbackPanel.tsx ❌
├── FeedContainer.tsx ❌
├── FilterPanel.tsx ❌
├── ForcesForGood.tsx ❌
├── InteractiveArticleView.tsx ❌
├── IntellectualSelfDefense.tsx ❌
├── JournalistRating.tsx ❌
├── Login.tsx ❌
├── LogRocketDashboard.tsx ❌
├── ManipulationAnalysis.tsx ❌
├── MediaLiteracyTraining.tsx ❌
├── NLPBenchmark.tsx ❌
├── NetworkAnalysis.tsx ❌
├── PWAInstallBanner.tsx ❌
├── PoliticalOrientationChart.tsx ❌
├── Register.tsx ❌
├── RhetoricalAnalysis.tsx ❌
├── SearchSortBar.tsx ❌
├── ServerMonitor.tsx ❌
├── SentimentAnalysisDashboard.tsx ❌
├── SourceCredibilityAssessment.tsx ❌
├── SourceCredibilityDashboard.tsx ❌
├── SubjectGuide.tsx ❌
├── Summarizer.tsx ❌
├── TextOverlayHighlighter.tsx ❌
├── UserProfile.tsx ❌
└── admin/
    ├── ONNXModelConverter.tsx ❌
    └── ONNXModelStatus.tsx ❌
```

### Components to Keep & Modify

```
src/components/
├── ArticleAnalysis.tsx ⚠️ (STRIP to fallacy-only)
├── ArticleParser.tsx ✅ (KEEP - URL parsing)
├── ErrorBoundary.tsx ✅ (KEEP - error handling)
├── Header.tsx ⚠️ (STRIP to minimal)
└── SkipLinks.tsx ✅ (KEEP - accessibility)
```

### Components to Create (New Simple Versions)

```
src/components/
├── ArticleInput.tsx ✨ NEW - Simple URL input form
└── FallacyAnalysisDisplay.tsx ✨ NEW - Display fallacy results
```

## Phase 3: Pages Deletion

### Pages to Delete

```
src/pages/
├── AboutPage.tsx ❌
├── AIAgentOrchestratorPage.tsx ❌
├── AnalysisPage.tsx ⚠️ (RENAME/REFACTOR to ResultsPage)
├── ArticleAnalysisPage.tsx ❌
├── ArticleFeedPage.tsx ❌
├── ArticleGeneratorPage.tsx ❌
├── ArticlePage.tsx ❌
├── AutonomousLearningPage.tsx ❌
├── BalancedFeedPage.tsx ❌
├── CollaborativeAINetworkPage.tsx ❌
├── ComparativeAnalysisPage.tsx ❌
├── FactCheckingPage.tsx ❌
├── ForcesForGoodPage.tsx ❌
├── IntellectualSelfDefensePage.tsx ❌
├── LibraryPage.tsx ❌
├── MediaLiteracyGuide.tsx ❌
├── ONNXAdminPage.tsx ❌
├── PoliticalAnalysisPage.tsx ❌
├── SentimentAnalysisPage.tsx ❌
└── SettingsPage.tsx ❌
```

### Pages to Keep & Modify

```
src/pages/
├── HomePage.tsx ⚠️ (REFACTOR - simple input form)
└── ArticleReaderPage.tsx ⚠️ (REFACTOR - rename to AnalysisPage, show results only)
```

## Phase 4: Services Cleanup

### Services to Delete

```
src/services/
├── advancedAIService.ts ❌
├── advancedBiasAnalysisService.ts ❌
├── advancedLogicalFallacyService.ts ❌
├── AIServiceManager.ts ❌
├── chromaService.ts ❌
├── CollaborationClient.ts ❌
├── comprehensiveAnalysisService.ts ❌
├── contentAnalysisService.ts ❌
├── darkPatternService.ts ❌
├── democracyForcesService.ts ❌
├── doomscrollAnalysisService.ts ❌
├── emotionAnalysisService.ts ❌
├── enhancedPromptService.ts ❌
├── factCheckingService.ts ❌
├── improvedArticleService.ts ❌ (keep only fetch logic)
├── intellectualSelfDefenseService.ts ❌
├── networkAnalysisService.ts ❌
├── nlpAnalysisService.ts ❌
├── onnxService.ts ❌
├── responseValidationService.ts ❌
├── sourceCredibilityService.ts ❌
├── stockpileService.ts ❌
└── userExperienceService.ts ❌
```

### Services to Keep & Modify

```
src/services/
├── aiAnalysisService.ts ⚠️ (STRIP to fallacy-only)
├── apiService.ts ⚠️ (STRIP to minimal API calls)
├── articleService.ts ⚠️ (STRIP to URL fetching only)
├── contentService.ts ⚠️ (KEEP - article extraction)
└── rssService.ts ⚠️ (STRIP to single URL fetch)
```

### Services to Create

```
src/services/
└── fallacyAnalysisService.ts ✨ NEW - Dedicated fallacy analysis service
```

## Phase 5: Backend Routes Cleanup

### Routes to Delete

```
routes/ (or server/routes/)
├── admin.js ❌
├── factCheckRoutes.js ❌
├── networkAnalysisRoutes.js ❌
├── onnx.js ❌
├── sourceCredibilityRoutes.js ❌
├── stockpile-simple.js ❌
├── stockpileRoutes.js ❌
├── improvedFeed.js ❌
├── user.js ❌
└── (Keep only: analysis.js - modified)
```

### Routes to Keep & Modify

```
routes/
├── analysis.js ⚠️ (MODIFY - fallacy-only endpoint)
└── article.js ⚠️ (STRIP - keep only fetch-article endpoint)
```

### Backend Services to Delete

```
services/
├── advancedAnalysisService.js ❌
├── alertService.js ❌
├── analyticsService.js ❌
├── articleStockpileService.js ❌
├── cacheService.js ❌
├── collaborationService.js ❌
├── comprehensiveAnalysisService.js ❌
├── enhancedStorageService.js ❌
├── jsonArticleService.js ⚠️ (DELETE - no storage needed)
├── jsonStorageService.js ⚠️ (DELETE - no storage needed)
├── monitorService.js ❌
├── onnxService.js ❌
└── productionAIService.js ⚠️ (MODIFY - simplify to fallacy analysis)
```

## Phase 6: Contexts & Hooks

### Contexts to Delete

```
src/contexts/
└── AuthContext.tsx ❌
```

### Contexts to Keep

```
src/contexts/
└── ThemeContext.tsx ✅ (OPTIONAL - can delete if not needed)
```

### Hooks to Delete

```
src/hooks/
├── useArticles.ts ❌
├── useImprovedArticles.ts ❌
└── useLlamaAnalysis.ts ⚠️ (MODIFY - rename to useFallacyAnalysis)
```

## Phase 7: Types Cleanup

### Types to Delete

```
src/types/
└── onnx.types.ts ❌
```

### Types to Keep & Modify

```
src/types/
├── index.ts ⚠️ (STRIP to minimal types: Article, FallacyAnalysis)
└── Article.ts ⚠️ (SIMPLIFY - remove user/source metadata)
```

## Phase 8: Utils Cleanup

### Utils to Delete

```
src/utils/
├── benchmarkUtils.ts ❌
├── logRocket.ts ❌
├── textSelection.ts ❌
└── trainingService.ts ❌
```

### Utils to Keep

```
src/utils/
├── articleUtils.ts ⚠️ (STRIP to basic text extraction)
├── htmlUtils.ts ✅ (KEEP - HTML parsing)
├── logger.ts ✅ (KEEP - logging)
└── textUtils.ts ⚠️ (STRIP to minimal text processing)
```

## Phase 9: Documentation Deletion

```
❌ ADMIN.md
❌ ARCHITECTURE.md
❌ BEST_PRACTICES.md (will rewrite)
❌ CODE_OF_CONDUCT.md
❌ CONTRIBUTING.md
❌ DEBUGGING.md
❌ DEPLOYMENT.md
❌ GIT-SETUP-SUMMARY.md
❌ GIT-WORKFLOW.md
❌ LLAMA_RAILWAY_DEPLOYMENT.md
❌ MONITORING.md
❌ OLLAMA_CLOUD_SETUP.md
❌ ONNX_INTEGRATION.md
❌ PRODUCTION-ARCHITECTURE.md
❌ RAILWAY_DEPLOYMENT.md
❌ README-FEEDBACK-LOOP.md
❌ SECURITY.md (will simplify)
❌ SOC2_COMPLIANCE.md
❌ STOCKPILE_SYSTEM.md
❌ TESTING.md (will simplify)
❌ TODO.md
❌ Plan.md
```

## Phase 10: Configuration Cleanup

### Config Files to Delete

```
❌ railway.json
❌ railway-production.json
❌ Procfile
❌ Procfile.heroku
❌ netlify.toml
❌ package-backend.json
❌ package-frontend.json
❌ package.heroku.json
❌ package.json.backend
❌ package.json.railway
❌ setup_ollama_cloud.md
```

### Config Files to Keep & Modify

```
✅ package.json (STRIP dependencies)
✅ vite.config.ts
✅ tsconfig.json
✅ tsconfig.app.json
✅ tsconfig.node.json
✅ eslint.config.js
```

## Phase 11: Test Cleanup

### Tests to Delete

```
__tests__/
├── auth.test.js ❌
├── sources.test.js ❌
└── (Keep only core analysis tests if any)
```

## Phase 12: Scripts & Tools Cleanup

### Scripts to Delete

```
❌ create-admin.js
❌ create-and-test-admin.js
❌ create-new-admin-copy.js
❌ create-new-admin.js
❌ create-simple-admin.js
❌ create-user.js
❌ debug-login.js
❌ setup-db-simple.js
❌ setup-dev.js
❌ setup-git-hooks.js
❌ setup-monitor.js
❌ setup.js (complex setup)
❌ simple-index.js
❌ simple-test.js
❌ subscribe-admin.js
❌ subscribe-admin2.js
❌ subscribe-seeded-admin.js
❌ test-api.js
❌ test-sources.js
❌ test.js
❌ server-monitor.js
```

## Phase 13: Database & Data Cleanup

### Delete

```
❌ data/ (all JSON storage files)
❌ db/ (database setup)
❌ migrations/ (all migrations)
❌ models/ (all Sequelize models)
❌ seeders/ (all seeders)
❌ chroma_data/
❌ chroma_db/
```

## Phase 14: Backend Directory Cleanup

### Delete entire backend directories (if separate)

```
❌ authentic-reader-backend/ (if exists as separate)
❌ server/controllers/ (keep only article controller, modified)
❌ server/middleware/ (keep only basic middleware)
❌ server/models/ ❌
❌ server/migrations/ ❌
❌ server/seeders/ ❌
```

## Phase 15: Refactoring Core Components

### 1. App.tsx - Simplify Routes

**Before:** 30+ routes
**After:** 2 routes max
- `/` - Input page
- `/analysis/:id` - Results page (optional, can be same page)

### 2. Create Simple Input Component

```typescript
// src/components/ArticleInput.tsx
- Single input field (URL)
- Submit button
- Optional: RSS feed URL option
```

### 3. Create Simple Analysis Display

```typescript
// src/components/FallacyAnalysisDisplay.tsx
- Display article title/content
- List of logical fallacies found
- Each fallacy shows: type, location, explanation, how/why/purpose
```

### 4. Simplify Backend API

**Keep only:**
- `POST /api/analyze-article` - Takes URL, returns fallacy analysis
- `GET /health` - Health check

**Remove all:**
- Authentication middleware
- User routes
- Admin routes
- Source management
- Feed aggregation
- Other analysis types

## Phase 16: Dependency Cleanup

### Review package.json and remove:

- Authentication libraries (passport, jwt, bcrypt)
- Database libraries (sequelize, pg)
- Monitoring libraries (logrocket, analytics)
- Complex state management (if any)
- PWA libraries (workbox, etc.)
- ONNX libraries
- ChromaDB libraries

### Keep only:

- React + TypeScript
- Express (backend)
- Axios (HTTP client)
- Basic utilities
- LLM client library (your choice)

## Execution Order

1. **Documentation** - Update README, delete obsolete docs
2. **Delete Frontend Components** - Remove all non-essential components
3. **Delete Frontend Pages** - Remove all non-essential pages
4. **Delete Services** - Remove all non-essential services
5. **Create New Simple Components** - Input form, analysis display
6. **Refactor App.tsx** - Simplify routing
7. **Backend Cleanup** - Delete routes, services, models
8. **Refactor Backend API** - Simplify to 2-3 endpoints
9. **Delete Database Code** - Remove all persistence
10. **Clean Dependencies** - Remove unused packages
11. **Test Core Flow** - URL input → Fetch → Analyze → Display
12. **Final Cleanup** - Remove test files, scripts, configs

## Success Criteria

✅ Application has single input: URL field  
✅ Application fetches article from URL  
✅ Application sends to LLM for fallacy analysis  
✅ Application displays fallacy analysis with how/why/purpose  
✅ No user authentication  
✅ No database storage  
✅ No other analysis types  
✅ Codebase reduced by 80%+  
✅ Simple, maintainable structure  

---

**Ready for execution after user confirmation.**

