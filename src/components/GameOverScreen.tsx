import './GameOverScreen.css'

interface GameOverScreenProps {
  onRestart: () => void
  onMenu: () => void
}

/**
 * Game Over Screen Component
 * Shows when the player is caught by an enemy
 */
export function GameOverScreen({ onRestart, onMenu }: GameOverScreenProps) {
  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <div className="game-over-title">
          <h1>GAME OVER</h1>
          <p className="game-over-message">You were caught!</p>
        </div>
        
        <div className="game-over-actions">
          <button className="action-button restart" onClick={onRestart}>
            Try Again
          </button>
          <button className="action-button menu" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}






