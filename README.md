# SMALL - A Grid Adventure

A modern, minimalist grid-based puzzle game built with React, TypeScript, and the LittleJS game engine. Navigate through a procedurally generated maze, solve puzzles, and escape from enemies!

🎮 **Play Now**: [https://small-umtu.onrender.com/](https://small-umtu.onrender.com/)

![Game Screenshot](https://github.com/amitsingh0024/small_game/raw/main/Screenshot%202025-12-02%20at%2012.06.30%20PM.png)

*Main menu with animated grid background and minimalist design*

## 🎮 Game Overview

SMALL is a grid-based puzzle game where you control a square character navigating through a maze. Your goal is to push blocks onto pressure plates to open exit gates while avoiding enemies that chase you.

## ✨ Features

- **Procedurally Generated Levels**: Each playthrough features a unique randomly generated maze
- **Grid-Based Movement**: Smooth, tile-based movement system
- **Puzzle Mechanics**: Push blocks onto pressure plates to open exit gates — the gate opens only once *every* plate is activated
- **Difficulty Progression**: Each level adds more walls, enemies, and plate/block pairs
- **Undo & Restart**: Press **Z** to undo a move or **R** to restart the level
- **Move Scoring**: Earn a 1–3 star rating for clearing a level in fewer moves
- **Daily Challenge**: A seeded maze that's identical for every player each day
- **Juicy Feedback**: Procedural sound effects, particle bursts, and screen shake (no asset downloads)
- **Enemy AI**: Two types of enemies with different behaviors:
  - **Orange Enemies**: Follow you around the entire map
  - **Purple Enemies**: Patrol specific areas and chase when you get too close
- **Power-ups**: Collect special items to gain advantages:
  - **Ghost** (Purple): Pass through walls 3 times
  - **Freeze** (Blue): Freeze all enemies for 7 moves
  - **Exit View** (Yellow): See exit and block locations
  - **Enemy View** (Orange): See enemy indicators outside your viewport
- **Theme System**: Light and dark mode support with persistent theme preference
- **Modern UI**: Clean, minimalist menu design with animated grid background
- **Options Menu**: Customizable game settings
- **Optimized Performance**: Highly optimized rendering for smooth 60 FPS gameplay
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and structured data for better search visibility
- **AdSense Integration**: Monetization support with Google AdSense

## 🎯 How to Play

### Controls
- **Arrow Keys** or **WASD** to move (one grid cell at a time)
- Push blue blocks onto yellow pressure plates
- **Z** to undo your last move, **R** to restart the level
- Reach the green exit gate to win (after every pressure plate is activated)

### Objectives
1. Push each blue block onto a yellow pressure plate
2. When **all** plates are activated the exit gate opens (turns green)
3. Navigate to the exit gate to complete the level
4. Avoid enemies - they will end your game on contact!
5. Clear the level in fewer moves to earn more stars (★★★)

### Modes & Progression
- **Play** — endless mode with fresh procedurally generated mazes
- **Daily Challenge** — a seeded maze that's the same for everyone that day
- Each level you clear increases the difficulty: more walls, more enemies, and
  more plate/block pairs to solve

### Tips
- Use power-ups strategically
- Ghost mode lets you pass through walls (limited uses)
- Freeze enemies when you need to make a quick escape
- Exit View and Enemy View help you plan your route
- Toggle between light and dark themes in the options menu

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

### Linting

```bash
npm run lint
```

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **LittleJS Engine** - Game engine for rendering and game loop
- **CSS3** - Styling with modern features
- **ESLint** - Code linting and quality

## 📁 Project Structure

```
website/
├── public/
│   ├── favicon.svg
│   ├── robots.txt          # SEO: Search engine crawler instructions
│   ├── sitemap.xml         # SEO: Site structure for search engines
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── AdSense.tsx     # Google AdSense integration component
│   │   ├── AdSense.css
│   │   ├── Game.tsx         # Main game component with LittleJS integration
│   │   ├── Game.css
│   │   ├── GameOverScreen.tsx
│   │   ├── GameOverScreen.css
│   │   ├── MenuScreen.tsx   # Main menu UI
│   │   ├── MenuScreen.css
│   │   ├── OptionsMenu.tsx  # Game options and settings
│   │   ├── OptionsMenu.css
│   │   ├── VictoryScreen.tsx
│   │   └── VictoryScreen.css
│   ├── contexts/
│   │   └── ThemeContext.tsx # Theme management (light/dark mode)
│   ├── App.tsx              # Root component
│   ├── App.css
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── dist/                    # Production build output
├── index.html               # HTML template with SEO meta tags
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # TypeScript app configuration
├── tsconfig.node.json       # TypeScript node configuration
├── eslint.config.js         # ESLint configuration
├── render.yaml              # Render.com deployment configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
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

### Theme System
- Light and dark mode support
- Theme preference saved to localStorage
- Smooth theme transitions

## 🔍 SEO Features

The project includes comprehensive SEO optimization:

- **Meta Tags**: Title, description, keywords, and author information
- **Open Graph Tags**: Optimized for Facebook, LinkedIn, and other social platforms
- **Twitter Card Tags**: Enhanced previews when shared on Twitter/X
- **Structured Data (JSON-LD)**: Schema.org VideoGame markup for better search engine understanding
- **Sitemap.xml**: Helps search engines discover and index pages
- **Robots.txt**: Guides search engine crawlers

## 🚀 Deployment

### Deploy to Render (Current Setup)

The project is configured for deployment on Render.com:

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
   - Your site will be live at `https://small-umtu.onrender.com/`

### Alternative Deployment Options

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the `dist` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Any static host**: Upload the `dist` folder contents

### Post-Deployment SEO Steps

1. Submit your sitemap to Google Search Console:
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Add your property: `https://small-umtu.onrender.com/`
   - Submit sitemap: `https://small-umtu.onrender.com/sitemap.xml`

2. Verify your site is indexed by search engines

3. Monitor performance using Google Analytics (if integrated)

## 📊 Performance

- Optimized for 60 FPS gameplay
- Fast initial load time
- Efficient rendering with LittleJS engine
- Minimal bundle size with Vite's tree-shaking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Test your changes thoroughly
4. Update documentation if needed

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [LittleJS](https://github.com/KilledByAPixel/LittleJS) game engine
- Inspired by classic grid-based puzzle games
- Deployed on [Render](https://render.com)

---

**Live Game**: [https://small-umtu.onrender.com/](https://small-umtu.onrender.com/)

Made with ❤️ using React and TypeScript
