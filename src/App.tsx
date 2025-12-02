import './App.css'
import Game from './components/Game'

/**
 * Main App Component
 * 
 * This is the root component of the game application.
 * The Game component handles the LittleJS engine integration.
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Grid Game</h1>
        <p className="instructions">
          Use Arrow Keys or WASD to move. Push the blue block onto the pressure plate to open the exit gate.
        </p>
      </header>
      
      <main className="game-container">
        <div className="game-area">
          <Game />
        </div>
      </main>
    </div>
  )
}

export default App
