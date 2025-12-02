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
  return (
    <div className="victory-screen">
      <div className="victory-content">
        <div className="victory-title">
          <h1>VICTORY!</h1>
          <p className="victory-message">You escaped!</p>
        </div>
        
        <div className="victory-actions">
          <button className="action-button next" onClick={onNext}>
            Next Level
          </button>
          <button className="action-button menu" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}






