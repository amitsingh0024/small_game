import { useState } from 'react'
import './MenuScreen.css'
import { OptionsMenu } from './OptionsMenu'
import { AdSense } from './AdSense'

interface MenuScreenProps {
  onStart: () => void
}

/**
 * Main Menu Screen Component
 * Shows when the game first loads or when paused
 */
export function MenuScreen({ onStart }: MenuScreenProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowOptions(true)
  }

  const handleOptionsTouch = (e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowOptions(true)
  }

  if (showOptions) {
    return <OptionsMenu onBack={() => setShowOptions(false)} />
  }

  if (showHowToPlay) {
    return (
      <div className="menu-screen">
        {/* Animated squares */}
        <div className="animated-square square-1"></div>
        <div className="animated-square square-2"></div>
        <div className="animated-square square-3"></div>
        <div className="animated-square square-4"></div>
        <div className="animated-square square-5"></div>
        <div className="animated-square square-6"></div>
        
        <div className="menu-content how-to-play-content">
          <button className="back-button" onClick={() => setShowHowToPlay(false)}>
            ← Back
          </button>
          
          <div className="menu-title">
            <h1>How to Play</h1>
          </div>
          
          <div className="menu-instructions">
            <h2>Controls</h2>
            <ul>
              <li>Use <strong>Arrow Keys</strong> or <strong>WASD</strong> to move</li>
              <li>Push the <strong>blue block</strong> onto the <strong>pressure plate</strong></li>
              <li>Activate the pressure plate to open the <strong>exit gate</strong></li>
              <li>Escape the enemies and reach the exit to win!</li>
            </ul>
            
            <div className="power-ups-info">
              <h2>Power-ups</h2>
              <div className="power-up-list">
                <div className="power-up-item">
                  <span className="power-up-color purple"></span>
                  <span><strong>Ghost</strong> - Pass through walls (3 times)</span>
                </div>
                <div className="power-up-item">
                  <span className="power-up-color blue"></span>
                  <span><strong>Freeze</strong> - Freeze enemies for 7 moves</span>
                </div>
                <div className="power-up-item">
                  <span className="power-up-color yellow"></span>
                  <span><strong>Exit View</strong> - See exit and block location</span>
                </div>
                <div className="power-up-item">
                  <span className="power-up-color orange"></span>
                  <span><strong>Enemy View</strong> - See enemies outside viewport</span>
                </div>
              </div>
            </div>

            <div className="enemy-info">
              <h2>Enemies</h2>
              <div className="power-up-list">
                <div className="power-up-item">
                  <span className="power-up-color orange"></span>
                  <span><strong>Orange Enemies</strong> - Follow you around the entire map</span>
                </div>
                <div className="power-up-item">
                  <span className="power-up-color purple"></span>
                  <span><strong>Purple Enemies</strong> - Patrol an 8x8 area. Chase if you get within 4x4 range!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-screen">
      {/* Animated squares */}
      <div className="animated-square square-1"></div>
      <div className="animated-square square-2"></div>
      <div className="animated-square square-3"></div>
      <div className="animated-square square-4"></div>
      <div className="animated-square square-5"></div>
      <div className="animated-square square-6"></div>
      
      <div className="menu-content">
        <div className="menu-title">
          <h1>SMALL</h1>
          <p className="menu-subtitle">A Grid Adventure</p>
        </div>
        
        <div className="menu-options">
          <button className="menu-button play" onClick={onStart}>
            Play
          </button>
          <button className="menu-button" onClick={() => setShowHowToPlay(true)}>
            How to Play
          </button>
          <button 
            className="menu-button" 
            onClick={handleOptionsClick}
            onTouchEnd={handleOptionsTouch}
          >
            Options
          </button>
        </div>
        
        {/* AdSense Ad */}
        <AdSense 
          adSlot="9697869538" 
          adFormat="auto"
          fullWidthResponsive={true}
          style={{ marginTop: '2rem' }}
        />
      </div>
    </div>
  )
}
