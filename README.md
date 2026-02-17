# Racing Rush

A modern pseudo-3D racing game built for GitHub Pages. Race through traffic, avoid obstacles, collect coins, and grab time extenders to survive as long as possible!

## Play Now

Visit: `https://vigneshwaranldv.github.io/racing-game-B/`

## Features

- **Pseudo-3D Graphics**: Realistic perspective-based rendering with lane-based movement
- **3-Lane Racing**: Switch lanes with arrow keys or A/D keys
- **Obstacles**: Avoid barriers that slow you down for 3 seconds
- **Collectibles**: 
  - Coins (+100 points)
  - Time Extenders (+15 seconds)
- **Timer System**: Start with 30 seconds, extend your race by collecting clocks
- **High Score**: Tracks your best race time locally
- **Modern UI**: Clean, responsive interface with smooth animations

## How to Play

1. Click **START RACE** to begin
2. Use **Arrow Keys** (← →) or **A/D** keys to switch lanes
3. **Avoid obstacles** (gray barriers with yellow stripes) - they slow you down!
4. **Collect coins** (gold circles) for points
5. **Grab time extenders** (blue clocks with +15) to add 15 seconds to your timer
6. Survive as long as possible - your final race time is your score!

## Controls

| Key | Action |
|-----|--------|
| ← or A | Move Left |
| → or D | Move Right |

## Technical Details

- **Pure JavaScript**: No external dependencies
- **HTML5 Canvas**: Hardware-accelerated 2D rendering
- **LocalStorage**: High score persistence
- **Responsive Design**: Scales to any screen size
- **GitHub Pages Ready**: Static files, no build process required

## Development

### Project Structure
```
racing-game-B/
├── index.html          # Main entry point
├── css/
│   └── style.css       # Game styling
├── js/
│   └── game.js         # Game engine
└── README.md           # This file
```

### Local Development

Simply open `index.html` in your browser:

```bash
# Using Python's built-in server
python -m http.server 8000

# Or using Node.js
npx serve

# Then visit http://localhost:8000
```

### GitHub Pages Setup

1. Fork or push this repository to `https://github.com/vigneshwaranldv/racing-game-B`
2. Go to repository **Settings** → **Pages**
3. Select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Your game will be live at `https://vigneshwaranldv.github.io/racing-game-B/`

## Game Mechanics

### Timer System
- **Start Time**: 30 seconds
- **Time Extender**: +15 seconds per clock collected
- **Game Over**: When timer reaches 0

### Speed States
- **Normal**: Base speed (green indicator)
- **Slow**: 50% speed for 3 seconds after hitting obstacle (blue indicator)
- **Speed Lines**: Visual effect during normal/high speed

### Scoring
- **Score**: Based on coins collected (100 points each)
- **High Score**: Longest race time achieved (saved locally)

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - Feel free to modify and distribute!

## Credits

Built with vanilla JavaScript and HTML5 Canvas for maximum compatibility and performance.