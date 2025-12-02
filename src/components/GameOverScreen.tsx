import './GameOverScreen.css'
import { AdSense } from './AdSense'

interface GameOverScreenProps {
  onRestart: () => void
  onMenu: () => void
}

/**
 * Game Over Screen Component
 * Shows when the player is caught by an enemy
 */
export function GameOverScreen({ onRestart, onMenu }: GameOverScreenProps) {
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
      className="game-over-screen"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="game-over-content">
        <div className="game-over-title">
          <h1>GAME OVER</h1>
          <p className="game-over-message">You were caught!</p>
        </div>
        
        <div className="game-over-actions">
          <button 
            className="action-button restart" 
            onClick={(e) => handleButtonClick(e, onRestart)}
            onTouchEnd={(e) => handleButtonTouch(e, onRestart)}
          >
            Try Again
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






