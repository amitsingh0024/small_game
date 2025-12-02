import { useTheme } from '../contexts/ThemeContext'
import './OptionsMenu.css'

interface OptionsMenuProps {
  onBack: () => void
}

export function OptionsMenu({ onBack }: OptionsMenuProps) {
  const { theme, toggleTheme, setTheme } = useTheme()

  return (
    <div className="menu-screen">
      {/* Animated squares */}
      <div className="animated-square square-1"></div>
      <div className="animated-square square-2"></div>
      <div className="animated-square square-3"></div>
      <div className="animated-square square-4"></div>
      <div className="animated-square square-5"></div>
      <div className="animated-square square-6"></div>
      
      <div className="menu-content options-content">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        
        <div className="menu-title">
          <h1>Options</h1>
        </div>
        
        <div className="options-section">
          <div className="option-item">
            <label className="option-label">Theme</label>
            <div className="theme-toggle">
              <button
                className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

