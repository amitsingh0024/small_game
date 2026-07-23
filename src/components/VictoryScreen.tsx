import './VictoryScreen.css'
import { AdSense } from './AdSense'

interface VictoryScreenProps {
  onNext: () => void
  onMenu: () => void
  level?: number
  moves?: number
  stars?: number
}

/**
 * Victory Screen Component
 * Shows when the player successfully reaches the exit
 */
export function VictoryScreen({ onNext, onMenu, level, moves, stars = 3 }: VictoryScreenProps) {
  const clampedStars = Math.max(0, Math.min(3, stars))
  const starRow = '★'.repeat(clampedStars) + '☆'.repeat(3 - clampedStars)
  const handleButtonTouch = (e: React.TouchEvent, callback: () => void) => {
    // Stop propagation to prevent game container from handling the touch
    e.stopPropagation()
    e.preventDefault()
    callback()
  }

  const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
    // Stop propagation to prevent game container from handling the click
    e.stopPropagation()
    callback()
  }

  return (
    <div 
      className="victory-screen"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="victory-content">
        <div className="victory-title">
          <h1>VICTORY!</h1>
          <p className="victory-message">You escaped!</p>
          <div className="victory-stars" aria-label={`${clampedStars} out of 3 stars`}>{starRow}</div>
          {(level !== undefined || moves !== undefined) && (
            <p className="victory-stats">
              {level !== undefined ? `Level ${level}` : ''}
              {level !== undefined && moves !== undefined ? ' · ' : ''}
              {moves !== undefined ? `${moves} moves` : ''}
            </p>
          )}
        </div>

        <div className="victory-actions">
          <button 
            className="action-button next" 
            onClick={(e) => handleButtonClick(e, onNext)}
            onTouchEnd={(e) => handleButtonTouch(e, onNext)}
          >
            Next Level
          </button>
          <button 
            className="action-button menu" 
            onClick={(e) => handleButtonClick(e, onMenu)}
            onTouchEnd={(e) => handleButtonTouch(e, onMenu)}
          >
            Main Menu
          </button>
        </div>
        
        {/* AdSense Ad */}
        <AdSense 
          adSlot="9697869538" 
          adFormat="auto"
          fullWidthResponsive={true}
          style={{ marginTop: '1.5rem' }}
        />
      </div>
    </div>
  )
}






