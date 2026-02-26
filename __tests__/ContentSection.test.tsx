import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContentSection from '@/components/ContentSection'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('ContentSection', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<ContentSection />)
    
    expect(screen.getByText('LOADING DRAFTS')).toBeInTheDocument()
    expect(screen.getByText('Reading workspace content...')).toBeInTheDocument()
  })

  it('renders content drafts when loaded successfully', async () => {
    // Mock successful file content response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`# Kelly's Content Angle Bank\n*20 High-Performing Tweet Formats*\n\nContent here...`),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mtime: '2026-02-26T00:00:00.000Z' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`# Rachel LinkedIn Content Calendar\n*For Brandon Geraldi*\n\nStrategy here...`),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mtime: '2026-02-14T00:00:00.000Z' }),
      } as Response)

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText('CONTENT DRAFTS')).toBeInTheDocument()
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
      expect(screen.getByText('Rachel LinkedIn Content Calendar')).toBeInTheDocument()
    })

    // Check for author and date info
    expect(screen.getByText('Kelly')).toBeInTheDocument()
    expect(screen.getByText('Rachel')).toBeInTheDocument()
    expect(screen.getByText('X Content')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn Content')).toBeInTheDocument()
  })

  it('falls back to mock data when file loading fails', async () => {
    // Mock failed responses
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText('CONTENT DRAFTS')).toBeInTheDocument()
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
      expect(screen.getByText('Rachel LinkedIn Content Calendar - 30 Days')).toBeInTheDocument()
    })
  })

  it('opens draft preview when clicked', async () => {
    // Mock successful responses with mock data fallback
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
    })

    // Click on Kelly's draft
    fireEvent.click(screen.getByText("Kelly's Content Angle Bank"))

    await waitFor(() => {
      expect(screen.getByText('← BACK')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument() // Status badge
    })
  })

  it('returns to list view when back button is clicked', async () => {
    // Mock successful responses with mock data fallback
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
    })

    // Open draft
    fireEvent.click(screen.getByText("Kelly's Content Angle Bank"))

    await waitFor(() => {
      expect(screen.getByText('← BACK')).toBeInTheDocument()
    })

    // Click back
    fireEvent.click(screen.getByText('← BACK'))

    await waitFor(() => {
      expect(screen.getByText('CONTENT DRAFTS')).toBeInTheDocument()
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
    })
  })

  it('displays error state when loading fails completely', async () => {
    mockFetch.mockRejectedValue(new Error('Complete failure'))
    
    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText('ERROR')).toBeInTheDocument()
      expect(screen.getByText('Failed to load content drafts')).toBeInTheDocument()
      expect(screen.getByText('RETRY')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('formats content correctly in preview mode', async () => {
    // Mock successful responses with mock data fallback  
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ContentSection />)

    await waitFor(() => {
      expect(screen.getByText("Kelly's Content Angle Bank")).toBeInTheDocument()
    })

    // Open draft
    fireEvent.click(screen.getByText("Kelly's Content Angle Bank"))

    await waitFor(() => {
      // Check that content is formatted (headings, etc.)
      expect(screen.getByText('Kelly')).toBeInTheDocument()
      expect(screen.getByText('2026-02-26')).toBeInTheDocument()
      expect(screen.getByText('2847 words')).toBeInTheDocument()
      expect(screen.getByText('11 min read')).toBeInTheDocument()
    })
  })

  it('shows correct status colors', async () => {
    // Mock successful responses with mock data fallback
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ContentSection />)

    await waitFor(() => {
      const draftBadges = screen.getAllByText('Draft')
      const reviewBadges = screen.getAllByText('Review')
      
      expect(draftBadges.length).toBeGreaterThan(0)
      expect(reviewBadges.length).toBeGreaterThan(0)
    })
  })
})