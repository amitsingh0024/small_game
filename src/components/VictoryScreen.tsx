import './VictoryScreen.css'

interface VictoryScreenProps {
  onNext: () => void
  onMenu: () => void
}

/**
 * Victory Screen Component
 * Shows when the player successfully reaches the exit
 */
export function VictoryScreen({ onNext, onMenu }: VictoryScreenProps) {
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
      </div>
    </div>
  )
}






