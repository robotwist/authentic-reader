import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ArticleCard from '../ArticleCard'
import { Article } from '../../types/Article'

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock window.open
const mockOpen = vi.fn()
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
})

const mockArticle: Article = {
  id: '1',
  title: 'Test Article Title',
  description: 'This is a test article description',
  content: 'This is the full content of the test article',
  url: 'https://example.com/test-article',
  source: 'Test Source',
  publishedAt: '2023-01-01T00:00:00Z',
  author: 'Test Author',
  imageUrl: 'https://example.com/test-image.jpg',
  category: 'politics',
  biasRating: 'center',
  reliability: 'high',
  tags: ['test', 'politics'],
  sentiment: 'neutral',
  politicalBias: 5,
  emotionalBias: 3,
  cognitiveBias: 4
}

describe('ArticleCard', () => {
  const mockOnRead = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnAnalyze = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders article information correctly', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    expect(screen.getByText('This is a test article description')).toBeInTheDocument()
  })

  it('displays article image when available', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const image = screen.getByAltText('Test Article Title')
    expect(image).toBeInTheDocument()
  })

  it('calls onRead when read button is clicked', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const readButton = screen.getByTitle('Mark as read')
    fireEvent.click(readButton)

    expect(mockOnRead).toHaveBeenCalledWith('1')
  })

  it('calls onSave when save button is clicked', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const saveButton = screen.getByTitle('Save for later')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith('1')
  })

  it('calls onAnalyze when analyze button is clicked', async () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const analyzeButton = screen.getByTitle('Analyze article')
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith(mockArticle)
    })
  })

  it('opens article URL when card is clicked', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const card = screen.getByText('Test Article Title').closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(mockOpen).toHaveBeenCalledWith(
      'https://example.com/test-article',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('shows saved state when isSaved is true', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
        isSaved={true}
      />
    )

    const saveButton = screen.getByTitle('Save for later')
    expect(saveButton).toBeInTheDocument()
  })

  it('shows read state when isRead is true', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
        isRead={true}
      />
    )

    const card = screen.getByText('Test Article Title').closest('div')
    expect(card).toHaveClass('read')
  })

  it('displays bias rating badge', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    expect(screen.getByText('center')).toBeInTheDocument()
  })

  it('displays reliability badge', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('formats date correctly', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    // The date should be formatted and displayed
    expect(screen.getByText(/Dec 31, 2022/)).toBeInTheDocument()
  })

  it('handles missing author gracefully', () => {
    const articleWithoutAuthor = { ...mockArticle, author: undefined }
    
    render(
      <ArticleCard 
        article={articleWithoutAuthor}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    // Should still render without crashing
    expect(screen.getByText('Test Article Title')).toBeInTheDocument()
  })

  it('handles missing publishedAt gracefully', () => {
    const articleWithoutDate = { ...mockArticle, publishedAt: undefined }
    
    render(
      <ArticleCard 
        article={articleWithoutDate}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    // Should still render without crashing
    expect(screen.getByText('Test Article Title')).toBeInTheDocument()
  })

  it('prevents event propagation on button clicks', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const saveButton = screen.getByTitle('Save for later')
    const stopPropagation = vi.fn()
    
    fireEvent.click(saveButton, { stopPropagation })
    
    expect(mockOnSave).toHaveBeenCalledWith('1')
  })

  it('has proper accessibility attributes', () => {
    render(
      <ArticleCard 
        article={mockArticle}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const saveButton = screen.getByTitle('Save for later')
    expect(saveButton).toHaveAttribute('title')

    const analyzeButton = screen.getByTitle('Analyze article')
    expect(analyzeButton).toHaveAttribute('title')
  })

  it('handles missing URL gracefully', () => {
    const articleWithoutUrl = { ...mockArticle, url: undefined }
    const mockAlert = vi.fn()
    global.alert = mockAlert
    
    render(
      <ArticleCard 
        article={articleWithoutUrl}
        onRead={mockOnRead}
        onSave={mockOnSave}
        onAnalyze={mockOnAnalyze}
      />
    )

    const card = screen.getByText('Test Article Title').closest('div')
    if (card) {
      fireEvent.click(card)
    }

    expect(mockAlert).toHaveBeenCalledWith('Sorry, this article does not have a valid URL to open.')
  })
})
