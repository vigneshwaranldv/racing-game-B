/**
 * Racing Rush - Pseudo-3D Racing Game
 * GitHub Pages compatible racing game with obstacles, collectibles, and time extenders
 */

class RacingGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'START'; // START, PLAYING, GAME_OVER
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game settings
        this.lanes = 3;
        this.laneWidth = 0;
        this.horizonY = 0;
        this.roadWidth = 0;
        
        // Player
        this.player = {
            lane: 1, // 0 = left, 1 = center, 2 = right
            targetLane: 1,
            x: 0,
            y: 0,
            width: 60,
            height: 100,
            laneChangeSpeed: 8,
            speed: 0,
            baseSpeed: 500,
            slowSpeed: 250,
            maxSpeed: 800,
            speedState: 'normal', // normal, slow, boost
            slowTimer: 0,
            slowDuration: 3000
        };
        
        // Game data
        this.timeRemaining = 30;
        this.score = 0;
        this.highScore = 0;
        this.totalRaceTime = 0;
        this.startTime = 0;
        
        // Objects
        this.objects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.minSpawnInterval = 600;
        
        // Visuals
        this.roadOffset = 0;
        this.markingOffset = 0;
        this.particles = [];
        this.floatingTexts = [];
        
        // Input
        this.keys = {};
        this.isPaused = false;
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Load high score
        this.highScore = parseInt(localStorage.getItem('racingRushHighScore')) || 0;
        document.getElementById('highscore').textContent = this.highScore + 's';
        
        // Setup canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Setup controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Handle tab visibility change to pause game
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Setup buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        
        // Start loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Calculate road dimensions
        this.horizonY = this.canvas.height * 0.35;
        this.roadWidth = Math.min(this.canvas.width * 0.7, 600);
        this.laneWidth = this.roadWidth / this.lanes;
        
        // Player position - bottom of car sits on road surface
        this.player.y = this.canvas.height - 80;
        this.updatePlayerX();
    }
    
    updatePlayerX() {
        const laneCenterX = this.canvas.width / 2;
        const laneOffset = (this.player.lane - 1) * this.laneWidth;
        this.player.x = laneCenterX + laneOffset;
    }
    
    handleKeyDown(e) {
        this.keys[e.key] = true;
        
        if (this.state === 'PLAYING') {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                if (this.player.targetLane > 0) {
                    this.player.targetLane--;
                }
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                if (this.player.targetLane < this.lanes - 1) {
                    this.player.targetLane++;
                }
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    handleVisibilityChange() {
        if (document.hidden && this.state === 'PLAYING') {
            // Pause game when tab is hidden
            this.isPaused = true;
            this.pauseStartTime = Date.now();
        } else if (!document.hidden && this.isPaused) {
            // Resume game when tab is visible
            this.isPaused = false;
            const pauseDuration = Date.now() - this.pauseStartTime;
            this.totalPausedTime += pauseDuration;
            // Adjust start time to account for pause
            this.startTime += pauseDuration;
        }
    }
    
    startGame() {
        // Reset game state
        this.state = 'PLAYING';
        this.timeRemaining = 30;
        this.score = 0;
        this.totalRaceTime = 0;
        this.startTime = Date.now();
        
        // Reset player
        this.player.lane = 1;
        this.player.targetLane = 1;
        this.player.speedState = 'normal';
        this.player.slowTimer = 0;
        this.updatePlayerX();
        
        // Reset objects
        this.objects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        
        // Reset particles
        this.particles = [];
        
        // Reset pause state
        this.isPaused = false;
        this.totalPausedTime = 0;
        
        // Update UI
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        this.updateHUD();
    }
    
    endGame() {
        this.state = 'GAME_OVER';
        
        // Calculate final race time (accounting for paused time)
        const finalTime = ((Date.now() - this.startTime - this.totalPausedTime) / 1000).toFixed(1);
        
        // Update high score if beaten
        const raceTime = Math.floor(parseFloat(finalTime));
        if (raceTime > this.highScore) {
            this.highScore = raceTime;
            localStorage.setItem('racingRushHighScore', this.highScore);
            document.getElementById('new-record').classList.remove('hidden');
        } else {
            document.getElementById('new-record').classList.add('hidden');
        }
        
        // Update UI
        document.getElementById('final-time').textContent = finalTime + 's';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('highscore').textContent = this.highScore + 's';
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (this.state === 'PLAYING' && !this.isPaused) {
            this.update(this.deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(dt) {
        const dtSeconds = dt / 1000;
        
        // Update timer
        this.timeRemaining -= dtSeconds;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame();
            return;
        }
        
        // Update player speed state
        if (this.player.speedState === 'slow') {
            this.player.slowTimer -= dt;
            if (this.player.slowTimer <= 0) {
                this.player.speedState = 'normal';
            }
        }
        
        // Set player speed based on state
        switch (this.player.speedState) {
            case 'slow':
                this.player.speed = this.player.slowSpeed;
                break;
            case 'boost':
                this.player.speed = this.player.maxSpeed;
                break;
            default:
                this.player.speed = this.player.baseSpeed;
        }
        
        // Smooth lane transition
        const targetX = this.canvas.width / 2 + (this.player.targetLane - 1) * this.laneWidth;
        const diff = targetX - this.player.x;
        if (Math.abs(diff) > 1) {
            this.player.x += diff * this.player.laneChangeSpeed * dtSeconds;
        } else {
            this.player.lane = this.player.targetLane;
        }
        
        // Update road markings
        this.roadOffset += this.player.speed * dtSeconds;
        this.markingOffset = this.roadOffset % 100;
        
        // Spawn objects
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnObject();
            this.spawnTimer = 0;
            // Gradually increase difficulty
            this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - 10);
        }
        
        // Update objects
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            
            // Move object toward player (perspective effect)
            obj.z -= this.player.speed * dtSeconds;
            
            // Calculate scale based on Z position (perspective)
            const progress = 1 - (obj.z / 3000);
            obj.scale = Math.max(0.1, progress);
            obj.currentY = this.horizonY + (this.canvas.height - this.horizonY) * progress;
            
            // Calculate X position with perspective
            const laneCenterX = this.canvas.width / 2;
            const laneOffset = (obj.lane - 1) * this.laneWidth * obj.scale;
            obj.currentX = laneCenterX + laneOffset;
            
            // Remove objects that passed the player
            if (obj.z <= 0) {
                this.objects.splice(i, 1);
                continue;
            }
            
            // Check collision
            if (obj.z < 200 && obj.z > 50) {
                // Use current visual lane position for more accurate collision
                const laneCenterX = this.canvas.width / 2;
                const laneOffset = this.player.x - laneCenterX;
                const playerLane = Math.round((laneOffset / this.laneWidth) + 1);
                const clampedLane = Math.max(0, Math.min(2, playerLane));
                
                if (obj.lane === clampedLane && !obj.collected) {
                    if (obj.type === 'obstacle') {
                        // Hit obstacle - slow down
                        this.player.speedState = 'slow';
                        this.player.slowTimer = this.player.slowDuration;
                        this.createParticles(obj.currentX, obj.currentY, '#e74c3c');
                        this.createFloatingText(obj.currentX, obj.currentY, 'SLOWED!', '#e74c3c');
                        this.objects.splice(i, 1);
                    } else {
                        // Collect item
                        obj.collected = true;
                        if (obj.type === 'coin') {
                            this.score += 100;
                            this.createParticles(obj.currentX, obj.currentY, '#f1c40f');
                            this.createFloatingText(obj.currentX, obj.currentY - 20, '+100', '#f1c40f');
                        } else if (obj.type === 'time') {
                            this.timeRemaining += 15;
                            this.createParticles(obj.currentX, obj.currentY, '#3498db');
                            this.createFloatingText(obj.currentX, obj.currentY - 20, '+15s', '#3498db');
                        }
                        this.objects.splice(i, 1);
                    }
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            p.vy += 0.3; // gravity
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    spawnObject() {
        const lane = Math.floor(Math.random() * this.lanes);
        const rand = Math.random();
        
        let type;
        if (rand < 0.5) {
            type = 'obstacle';
        } else if (rand < 0.8) {
            type = 'coin';
        } else {
            type = 'time';
        }
        
        this.objects.push({
            type: type,
            lane: lane,
            z: 3000,
            scale: 0.1,
            currentX: 0,
            currentY: 0,
            collected: false
        });
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                life: 500,
                color: color,
                size: Math.random() * 5 + 2
            });
        }
    }
    
    createFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1000,
            maxLife: 1000,
            vy: -1
        });
    }
    
    updateHUD() {
        const timerEl = document.getElementById('timer');
        timerEl.textContent = this.timeRemaining.toFixed(1);
        
        const timerDisplay = timerEl.closest('.timer-display');
        if (this.timeRemaining <= 5) {
            timerDisplay.classList.add('warning');
        } else {
            timerDisplay.classList.remove('warning');
        }
        
        document.getElementById('score').textContent = this.score;
        
        // Update speed bar
        const speedBar = document.getElementById('speed-bar');
        const speedLabel = document.getElementById('speed-label');
        
        speedBar.className = 'speed-bar';
        speedLabel.className = 'speed-label';
        
        if (this.player.speedState === 'slow') {
            speedBar.classList.add('slow');
            speedLabel.classList.add('slow');
            speedLabel.textContent = 'SLOWED';
        } else if (this.player.speedState === 'boost') {
            speedBar.classList.add('boost');
            speedLabel.classList.add('boost');
            speedLabel.textContent = 'BOOST';
        } else {
            speedLabel.textContent = 'NORMAL';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.horizonY);
        skyGradient.addColorStop(0, '#1a1a2e');
        skyGradient.addColorStop(0.5, '#16213e');
        skyGradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.horizonY);
        
        // Draw sun/moon
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width * 0.8, this.horizonY * 0.3, 40, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(243, 156, 18, 0.3)';
        this.ctx.fill();
        
        // Draw road
        this.drawRoad();
        
        // Draw objects (sorted by Z for proper depth)
        this.objects.sort((a, b) => b.z - a.z);
        for (const obj of this.objects) {
            this.drawObject(obj);
        }
        
        // Draw player
        this.drawPlayer();
        
        // Draw lane position indicators near car
        this.drawLaneIndicators();
        
        // Draw particles
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * (p.life / 500), 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 500;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Draw floating texts
        for (const ft of this.floatingTexts) {
            this.ctx.save();
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = ft.color;
            this.ctx.globalAlpha = ft.life / ft.maxLife;
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
        
        // Draw speed lines effect
        if (this.state === 'PLAYING' && this.player.speedState !== 'slow') {
            this.drawSpeedLines();
        }
    }
    
    drawRoad() {
        const centerX = this.canvas.width / 2;
        const roadTopWidth = this.roadWidth * 0.1;
        const roadBottomWidth = this.roadWidth;
        
        // Draw road base
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX + roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX + roadBottomWidth / 2, this.canvas.height);
        this.ctx.lineTo(centerX - roadBottomWidth / 2, this.canvas.height);
        this.ctx.closePath();
        
        const roadGradient = this.ctx.createLinearGradient(0, this.horizonY, 0, this.canvas.height);
        roadGradient.addColorStop(0, '#1a252f');
        roadGradient.addColorStop(0.5, '#2c3e50');
        roadGradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = roadGradient;
        this.ctx.fill();
        
        // Draw road texture/pavement grain
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX + roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX + roadBottomWidth / 2, this.canvas.height);
        this.ctx.lineTo(centerX - roadBottomWidth / 2, this.canvas.height);
        this.ctx.closePath();
        this.ctx.clip();
        
        // Add pavement grain texture
        for (let i = 0; i < 300; i++) {
            const grainY = this.horizonY + Math.random() * (this.canvas.height - this.horizonY);
            const progress = (grainY - this.horizonY) / (this.canvas.height - this.horizonY);
            const roadWidthAtY = roadTopWidth + (roadBottomWidth - roadTopWidth) * progress;
            const grainX = centerX - roadWidthAtY / 2 + Math.random() * roadWidthAtY;
            const grainSize = 1 + Math.random() * 2;
            const alpha = 0.05 + Math.random() * 0.1;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(grainX, grainY, grainSize, grainSize);
        }
        this.ctx.restore();
        
        // Draw road surface shading for depth
        const surfaceGradient = this.ctx.createLinearGradient(0, this.canvas.height - 200, 0, this.canvas.height);
        surfaceGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        surfaceGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        this.ctx.fillStyle = surfaceGradient;
        this.ctx.fill();
        
        // Draw road borders
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX - roadBottomWidth / 2, this.canvas.height);
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + roadTopWidth / 2, this.horizonY);
        this.ctx.lineTo(centerX + roadBottomWidth / 2, this.canvas.height);
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw lane markings
        const laneMarkingSpacing = 100;
        const numMarkings = Math.ceil((this.canvas.height - this.horizonY) / laneMarkingSpacing) + 2;
        
        for (let i = 0; i < this.lanes - 1; i++) {
            const laneOffset = (i + 1) / this.lanes - 0.5;
            
            for (let j = -1; j < numMarkings; j++) {
                const y = this.horizonY + ((j * laneMarkingSpacing + this.markingOffset) % (numMarkings * laneMarkingSpacing));
                if (y > this.horizonY && y < this.canvas.height) {
                    const progress = (y - this.horizonY) / (this.canvas.height - this.horizonY);
                    const width = 4 * progress;
                    const x = centerX + laneOffset * (roadTopWidth + (roadBottomWidth - roadTopWidth) * progress);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x, y + 50 * progress);
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.lineWidth = width;
                    this.ctx.setLineDash([20 * progress, 20 * progress]);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.setLineDash([]);
        
        // Draw roadside scenery
        this.drawScenery();
    }
    
    drawScenery() {
        const centerX = this.canvas.width / 2;
        const roadBottomWidth = this.roadWidth;
        
        // Left side buildings/trees
        for (let i = 0; i < 10; i++) {
            const progress = i / 10;
            const y = this.horizonY + (this.canvas.height - this.horizonY) * progress;
            const x = centerX - roadBottomWidth / 2 - 50 - progress * 100;
            const size = 30 + progress * 50;
            
            // Tree/building shape
            this.ctx.fillStyle = `rgba(46, 204, 113, ${0.3 + progress * 0.5})`;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x + size / 2, y);
            this.ctx.lineTo(x - size / 2, y);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Right side buildings/trees
        for (let i = 0; i < 10; i++) {
            const progress = i / 10;
            const y = this.horizonY + (this.canvas.height - this.horizonY) * progress;
            const x = centerX + roadBottomWidth / 2 + 50 + progress * 100;
            const size = 30 + progress * 50;
            
            this.ctx.fillStyle = `rgba(46, 204, 113, ${0.3 + progress * 0.5})`;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x + size / 2, y);
            this.ctx.lineTo(x - size / 2, y);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const w = this.player.width;
        const h = this.player.height;
        
        // Ground shadow - large soft shadow under car
        const shadowGradient = this.ctx.createRadialGradient(x, y + h / 2 - 5, 0, x, y + h / 2 - 5, w * 0.8);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = shadowGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + h / 2 - 5, w * 0.7, h / 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tire contact shadows - darker spots where tires touch road
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(x - w / 2.5, y + h / 2 - 5, 12, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x + w / 2.5, y + h / 2 - 5, 12, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Car body
        const bodyGradient = this.ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
        bodyGradient.addColorStop(0, '#e74c3c');
        bodyGradient.addColorStop(0.5, '#c0392b');
        bodyGradient.addColorStop(1, '#e74c3c');
        
        // Main body
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x - w / 3, y - h / 2);
        this.ctx.lineTo(x + w / 3, y - h / 2);
        this.ctx.lineTo(x + w / 2, y);
        this.ctx.lineTo(x + w / 2, y + h / 3);
        this.ctx.lineTo(x - w / 2, y + h / 3);
        this.ctx.lineTo(x - w / 2, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Roof/windshield
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.moveTo(x - w / 4, y - h / 4);
        this.ctx.lineTo(x + w / 4, y - h / 4);
        this.ctx.lineTo(x + w / 3, y);
        this.ctx.lineTo(x - w / 3, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Windshield highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(x - w / 4, y - h / 4);
        this.ctx.lineTo(x - w / 6, y - h / 6);
        this.ctx.lineTo(x - w / 3, y);
        this.ctx.lineTo(x - w / 3, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Headlights
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(x - w / 3, y + h / 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + w / 3, y + h / 3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Headlight glow
        this.ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - w / 3, y + h / 3, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + w / 3, y + h / 3, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Brake lights
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(x - w / 3, y - h / 2 + 5, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + w / 3, y - h / 2 + 5, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wheels/Tires - make car look grounded
        const wheelY = y + h / 2 - 5;
        const wheelSize = 10;
        
        // Left wheel
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(x - w / 2.5, wheelY, wheelSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Right wheel
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(x + w / 2.5, wheelY, wheelSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Slow effect indicator
        if (this.player.speedState === 'slow') {
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, w, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    drawObject(obj) {
        const x = obj.currentX;
        const y = obj.currentY;
        const scale = obj.scale;
        const size = 60 * scale;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size / 2, size / 2, size / 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (obj.type === 'obstacle') {
            // Draw obstacle (barrier/block)
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
            
            // Stripes
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.beginPath();
            this.ctx.moveTo(x - size / 2, y - size / 2);
            this.ctx.lineTo(x - size / 2 + size / 4, y - size / 2);
            this.ctx.lineTo(x + size / 2, y + size / 2 - size / 4);
            this.ctx.lineTo(x + size / 2, y + size / 2);
            this.ctx.lineTo(x + size / 2 - size / 4, y + size / 2);
            this.ctx.lineTo(x - size / 2, y - size / 2 + size / 4);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.strokeRect(x - size / 2, y - size / 2, size, size);
            
        } else if (obj.type === 'coin') {
            // Draw coin
            const coinGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            coinGradient.addColorStop(0, '#f1c40f');
            coinGradient.addColorStop(1, '#d4ac0d');
            
            this.ctx.fillStyle = coinGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner circle
            this.ctx.fillStyle = '#f39c12';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Shine
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(x - size / 6, y - size / 6, size / 8, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (obj.type === 'time') {
            // Draw time extender (clock)
            const timeGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size / 2);
            timeGradient.addColorStop(0, '#3498db');
            timeGradient.addColorStop(1, '#2980b9');
            
            this.ctx.fillStyle = timeGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Clock face
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Clock hands
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y - size / 5);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + size / 6, y);
            this.ctx.stroke();
            
            // +15 text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `bold ${10 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('+15', x, y + size / 2 + 12 * scale);
        }
    }
    
    drawSpeedLines() {
        const numLines = 10;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < numLines; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const length = 50 + Math.random() * 100;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + length);
            this.ctx.stroke();
        }
    }
    
    drawLaneIndicators() {
        const centerX = this.canvas.width / 2;
        const carY = this.player.y + this.player.height / 2;
        const indicatorY = carY + 20;
        
        // Draw lane markers at car level
        for (let i = 0; i < this.lanes; i++) {
            const laneX = centerX + (i - 1) * this.laneWidth;
            
            // Lane number or indicator
            this.ctx.save();
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillText((i + 1).toString(), laneX, indicatorY);
            
            // Highlight current lane
            if (i === this.player.lane) {
                this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(laneX, indicatorY - 5, 15, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }
        
        // Draw lane dividers near car
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        
        for (let i = 1; i < this.lanes; i++) {
            const dividerX = centerX + (i - 1.5) * this.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(dividerX, carY - 50);
            this.ctx.lineTo(dividerX, carY + 50);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RacingGame();
});