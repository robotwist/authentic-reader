import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/Auth.css'
import './styles/Profile.css'
import './styles/ArticleAnalysis.css'
import './styles/FeedContainer.css'
import './styles/ArticleCard.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
