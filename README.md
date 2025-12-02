# SMALL - A Grid Adventure

A modern, minimalist grid-based puzzle game built with React, TypeScript, and the LittleJS game engine. Navigate through a procedurally generated maze, solve puzzles, and escape from enemies!

![Game Screenshot](https://github.com/amitsingh0024/small_game/raw/main/Screenshot%202025-12-02%20at%2012.06.30%20PM.png)

*Main menu with animated grid background and minimalist design*

> **Note**: The screenshot shows the modern minimalist menu design with animated colored squares moving across the grid background.

## 🎮 Game Overview

SMALL is a grid-based puzzle game where you control a square character navigating through a maze. Your goal is to push blocks onto pressure plates to open exit gates while avoiding enemies that chase you.

## ✨ Features

- **Procedurally Generated Levels**: Each playthrough features a unique randomly generated maze
- **Grid-Based Movement**: Smooth, tile-based movement system
- **Puzzle Mechanics**: Push blocks onto pressure plates to open exit gates
- **Enemy AI**: Two types of enemies with different behaviors:
  - **Orange Enemies**: Follow you around the entire map
  - **Purple Enemies**: Patrol specific areas and chase when you get too close
- **Power-ups**: Collect special items to gain advantages:
  - **Ghost** (Purple): Pass through walls 3 times
  - **Freeze** (Blue): Freeze all enemies for 7 moves
  - **Exit View** (Yellow): See exit and block locations
  - **Enemy View** (Orange): See enemy indicators outside your viewport
- **Modern UI**: Clean, minimalist menu design with animated grid background
- **Optimized Performance**: Highly optimized rendering for smooth 60 FPS gameplay

## 🎯 How to Play

### Controls
- **Arrow Keys** or **WASD** to move
- Move one grid cell at a time
- Push blue blocks onto yellow pressure plates
- Reach the green exit gate to win (after activating the pressure plate)

### Objectives
1. Push the blue block onto the yellow pressure plate
2. The pressure plate activates and opens the exit gate (turns green)
3. Navigate to the exit gate to complete the level
4. Avoid enemies - they will end your game on contact!

### Tips
- Use power-ups strategically
- Ghost mode lets you pass through walls (limited uses)
- Freeze enemies when you need to make a quick escape
- Exit View and Enemy View help you plan your route

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/amitsingh0024/small_game.git
cd small_game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **LittleJS Engine** - Game engine for rendering and game loop
- **CSS3** - Styling with modern features

## 📁 Project Structure

```
website/
├── src/
│   ├── components/
│   │   ├── Game.tsx          # Main game component
│   │   ├── MenuScreen.tsx    # Menu UI
│   │   ├── GameOverScreen.tsx # Game over screen
│   │   └── VictoryScreen.tsx # Victory screen
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🎨 Game Mechanics

### Grid System
- 7x7 viewport centered on the player
- Infinite world with procedurally generated walls
- Grid-based movement with smooth interpolation

### Enemy Behavior
- **Orange Enemies**: Continuously pathfind towards the player
- **Purple Enemies**: Patrol an 8x8 area, chase if player enters 4x4 range

### Power-up System
- Power-ups respawn to maintain game balance
- Each power-up has a limited duration or uses
- Visual indicators show active power-up effects

## 🚀 Deployment

### Deploy to Render (Recommended)

1. **Sign up/Login** to [Render](https://render.com)

2. **Create a New Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository: `amitsingh0024/small_game`
   - Render will auto-detect the settings from `render.yaml`

3. **Configure (if needed)**:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: `18.x` (or higher)

4. **Deploy**:
   - Click "Create Static Site"
   - Render will build and deploy automatically
   - Your site will be live at `https://your-app-name.onrender.com`

### Alternative Deployment Options

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Any static host**: Upload the `dist` folder contents

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [LittleJS](https://github.com/KilledByAPixel/LittleJS) game engine
- Inspired by classic grid-based puzzle games

---

Made with ❤️ using React and TypeScript
