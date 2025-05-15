console.log('🔥 game.js is loaded at ' + new Date().toISOString());

// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelSelect = document.getElementById('levelSelect');
const levelGrid = document.getElementById('levelGrid');
const levelComplete = document.getElementById('levelComplete');
const levelScore = document.getElementById('levelScore');
const enemiesDefeated = document.getElementById('enemiesDefeated');
const totalEnemies = document.getElementById('totalEnemies');

let gameState = 'start';
let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    speed: 5,
    powerLevel: 1,
    hasShield: false,
    isFrozen: false,
    freezeTimer: 0,
    screenShake: 0
};
let enemies = [];
let bullets = [];
let powerUps = [];
let notifications = [];
let score = 0;
let currentLevel = 1;
let maxLevel = 20;
let gameOver = false;
let keys = {};
let levelStartTime = 0;
let levelDuration = 0;
let enemiesKilled = 0;
let enemiesRequired = 0;
let totalEnemiesSpawned = 0;

// Level configurations with difficulty indicators
const levelConfigs = [
    { enemies: 15, speed: 1.0, spawnRate: 1.0, difficulty: "Easy", powerUpChance: 0.3 },      // Level 1
    { enemies: 25, speed: 1.2, spawnRate: 1.1, difficulty: "Easy", powerUpChance: 0.3 },      // Level 2
    { enemies: 35, speed: 1.4, spawnRate: 1.2, difficulty: "Easy", powerUpChance: 0.3 },     // Level 3
    { enemies: 45, speed: 1.6, spawnRate: 1.3, difficulty: "Easy", powerUpChance: 0.3 },     // Level 4
    { enemies: 55, speed: 1.8, spawnRate: 1.4, difficulty: "Medium", powerUpChance: 0.25 },   // Level 5
    { enemies: 65, speed: 2.0, spawnRate: 1.5, difficulty: "Medium", powerUpChance: 0.25 },   // Level 6
    { enemies: 75, speed: 2.1, spawnRate: 1.5, difficulty: "Medium", powerUpChance: 0.25 },   // Level 7
    { enemies: 85, speed: 2.2, spawnRate: 1.6, difficulty: "Medium", powerUpChance: 0.25 },   // Level 8
    { enemies: 95, speed: 2.3, spawnRate: 1.6, difficulty: "Medium", powerUpChance: 0.2 },   // Level 9
    { enemies: 105, speed: 2.4, spawnRate: 1.7, difficulty: "Hard", powerUpChance: 0.2 },     // Level 10
    { enemies: 115, speed: 2.5, spawnRate: 1.7, difficulty: "Hard", powerUpChance: 0.2 },     // Level 11
    { enemies: 125, speed: 2.6, spawnRate: 1.8, difficulty: "Hard", powerUpChance: 0.2 },     // Level 12
    { enemies: 135, speed: 2.7, spawnRate: 1.8, difficulty: "Hard", powerUpChance: 0.15 },     // Level 13
    { enemies: 145, speed: 2.8, spawnRate: 1.9, difficulty: "Hard", powerUpChance: 0.15 },     // Level 14
    { enemies: 155, speed: 2.9, spawnRate: 1.9, difficulty: "Expert", powerUpChance: 0.15 },   // Level 15
    { enemies: 165, speed: 3.0, spawnRate: 2.0, difficulty: "Expert", powerUpChance: 0.15 },   // Level 16
    { enemies: 175, speed: 3.1, spawnRate: 2.0, difficulty: "Expert", powerUpChance: 0.1 },   // Level 17
    { enemies: 185, speed: 3.2, spawnRate: 2.1, difficulty: "Expert", powerUpChance: 0.1 },   // Level 18
    { enemies: 195, speed: 3.3, spawnRate: 2.1, difficulty: "Expert", powerUpChance: 0.1 },   // Level 19
    { enemies: 205, speed: 3.4, spawnRate: 2.2, difficulty: "Master", powerUpChance: 0.1 }    // Level 20
];

// Add power-up types
const powerUpTypes = [
    { type: 'speed',     color: '#00ffff', duration: 5000, effect: () => { player.speed *= 1.5; } },
    { type: 'firepower', color: '#ff00ff', duration: 5000, effect: () => { player.powerLevel++; } },
    { type: 'shield',    color: '#ffff00', duration: 3000, effect: () => { player.hasShield = true; } },

    // ← add a comma above, then this nuke entry as a fourth element:
    // inside your powerUpTypes array, replace the nuke entry with:
{
    type: 'nuke',
    color: '#ffffff',
    duration: 0,     // instantaneous
    effect: function() {
      // grab only the guys that are actually on‐screen:
      const onScreen = enemies.filter(e => e.y >= 0 && e.y <= canvas.height);
      const count    = onScreen.length;
  
      // credit your kill count and score
      enemiesKilled += count;
      score         += count * 10;
  
      // now remove just those on‐screen enemies,
      // leaving the off‐screen ones (above or below) intact:
      enemies = enemies.filter(e => e.y < 0 || e.y > canvas.height);
    }
  }
  
];

  
// Add power-down types
const powerDownTypes = [
    { type: 'slow', color: '#ff0000', duration: 3000, effect: () => { player.speed *= 0.5; } },
    { type: 'freeze', color: '#0000ff', duration: 2000, effect: () => { 
        player.isFrozen = true;
        player.freezeTimer = 2000;
    }},
    { type: 'shake', color: '#ff8800', duration: 4000, effect: () => { 
        player.screenShake = 4000;
    }}
];

// Create level buttons
for (let i = 1; i <= maxLevel; i++) {
    const button = document.createElement('button');
    button.className = 'level-button';
    button.textContent = i;
    
    button.onclick = function() {
        console.log('Level button clicked:', i);
        currentLevel = i;
        gameState = 'playing';
        levelSelect.style.display = 'none';
        levelComplete.style.display = 'none';
        
        // Reset game state
        score = 0;
        gameOver = false;
        enemies = [];
        bullets = [];
        powerUps = [];
        notifications = [];
        enemiesKilled = 0;
        enemiesRequired = levelConfigs[i - 1].enemies;
        totalEnemiesSpawned = 0;
        
        // Reset all player power-up states
        player = {
            x: canvas.width / 2,
            y: canvas.height - 50,
            speed: 5,
            powerLevel: 1,
            hasShield: false,
            isFrozen: false,
            freezeTimer: 0,
            screenShake: 0
        };
        
        // Start the level
        levelStartTime = Date.now();
        
        // Force immediate enemy spawn
        const config = levelConfigs[currentLevel - 1];
        const baseSpeed = 2;
        const totalEnemies = Math.floor(config.enemies * 2);
        
        // Clear any existing enemies
        enemies = [];
        enemiesKilled = 0;
        
        // Create all enemies for the level with more spacing
        for (let j = 0; j < totalEnemies; j++) {
            const verticalSpacing = 60;
            const horizontalOffset = (Math.random() - 0.5) * 150;
            
            enemies.push({
                x: Math.random() * (canvas.width - 150) + 75 + horizontalOffset,
                y: -20 - (j * verticalSpacing),
                speed: (Math.random() * 1.2 + baseSpeed) * config.speed
            });
            totalEnemiesSpawned++;
        }
    };
    
    levelGrid.appendChild(button);
}

function showLevelComplete() {
    levelDuration = (Date.now() - levelStartTime) / 1000;
    levelScore.textContent = score;
    enemiesDefeated.textContent = enemiesKilled;
    totalEnemies.textContent = enemiesRequired;
    levelComplete.style.display = 'block';
    gameState = 'levelComplete';
}

function shoot() {
    for (let i = 0; i < player.powerLevel; i++) {
        let offset = (i - (player.powerLevel - 1) / 2) * 10;
        bullets.push({
            x: player.x + offset,
            y: player.y - 20,
            speed: 7
        });
    }
}

function updatePlayer() {
    if (player.isFrozen) {
        player.freezeTimer -= 16;
        if (player.freezeTimer <= 0) {
            player.isFrozen = false;
        }
        return;
    }

    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(25, Math.min(canvas.width - 25, player.x));
}

function drawPlayer() {
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 20);
    ctx.lineTo(player.x - 15, player.y + 10);
    ctx.lineTo(player.x + 15, player.y + 10);
    ctx.closePath();
    ctx.fill();
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function drawBullets() {
    ctx.fillStyle = '#ffffff';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.ellipse(bullet.x, bullet.y, 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Add notification system
function addNotification(text, color) {
    notifications.push({
        text: text,
        color: color,
        y: canvas.height - 100,
        opacity: 1,
        timer: 2000
    });
}

function updateNotifications() {
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].timer -= 16;
        notifications[i].opacity = notifications[i].timer / 2000;
        notifications[i].y -= 0.5;

        if (notifications[i].timer <= 0) {
            notifications.splice(i, 1);
        }
    }
}

function drawNotifications() {
    notifications.forEach(notification => {
        ctx.save();
        ctx.globalAlpha = notification.opacity;
        ctx.fillStyle = notification.color;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.text, canvas.width/2, notification.y);
        ctx.restore();
    });
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += 2;
        
        if (checkCollision(powerUps[i], player)) {
            powerUps[i].effect();
            
            let notificationText = '';
            switch(powerUps[i].type) {
                case 'nuke':
                    notificationText = '💥 NUKE!';
                    break;

                case 'speed':
                    notificationText = 'Speed Boost!';
                    break;
                case 'firepower':
                    notificationText = 'Firepower Up!';
                    break;
                case 'shield':
                    notificationText = 'Shield Activated!';
                    break;
                case 'slow':
                    notificationText = 'Speed Reduced!';
                    break;
                case 'freeze':
                    notificationText = 'Frozen!';
                    break;
                case 'shake':
                    notificationText = 'Screen Shaking!';
                    break;
            }
            addNotification(notificationText, powerUps[i].color);
            
            powerUps.splice(i, 1);
            continue;
        }
        
        if (powerUps[i].y > canvas.height + 20) {
            powerUps.splice(i, 1);
        }
    }
}
/**
 * Try to spawn a power–up (or, occasionally, a power–down)
 * @param {number} x
 * @param {number} y
 */
/**
 * Try to spawn a power-up (or power-down).  
 * Currently set to always drop a nuke (100% chance) for testing.
 */
/**
 * Try to spawn a power-up (or power-down).
 * Currently set to always drop a nuke (100% chance) for testing.
 */
function spawnPowerUp(x, y) {
    const config = levelConfigs[currentLevel - 1];
  
    // 1) Nuke (20% chance)
    if (Math.random() < 0.01) {
      const nuke = powerUpTypes.find(p => p.type === 'nuke');
      if (!nuke) {
        console.error('spawnPowerUp: “nuke” not found in powerUpTypes!');
        return;
      }
      powerUps.push({ x, y, ...nuke });
      console.log('💣 spawned Nuke at', x, y);
      return;
    }
  
    // 2) Good power-up (config.powerUpChance)
    if (Math.random() < config.powerUpChance) {
      // build a list _without_ nukes
      const goodUps = powerUpTypes.filter(p => p.type !== 'nuke');
      if (goodUps.length === 0) {
        console.error('spawnPowerUp: no good powerUps available!');
        return;
      }
      const idx = Math.floor(Math.random() * goodUps.length);
      const pu  = goodUps[idx];
      powerUps.push({ x, y, ...pu });
      console.log('🆙 spawned', pu.type, 'at', x, y);
      return;
    }
  
    // 3) Power-down (10% chance)
    if (Math.random() < 0.1) {
      if (powerDownTypes.length === 0) {
        console.error('spawnPowerUp: powerDownTypes is empty!');
        return;
      }
      const idx = Math.floor(Math.random() * powerDownTypes.length);
      const pd  = powerDownTypes[idx];
      powerUps.push({ x, y, ...pd });
      console.log('⚠️ spawned', pd.type, 'at', x, y);
      return;
    }
  
    // else: nothing this time
  }
  
  
/**
 * Move enemies, handle bullet hits, player collisions, off-screen removal,
 * then trigger level-complete or game-over when the wave is done.
 */
function updateEnemies() {
    // 1) Move all enemies down
    enemies.forEach(enemy => {
      enemy.y += enemy.speed;
    });
  
    // 2) Check bullet collisions: mark hits
    const bulletsToRemove = new Set();
    const enemiesToRemove = new Set();
  
    bullets.forEach((bullet, bi) => {
      enemies.forEach((enemy, ei) => {
        if (!enemiesToRemove.has(ei) && checkCollision(enemy, bullet)) {
          score += 10;
          enemiesKilled++;
          spawnPowerUp(enemy.x, enemy.y);
          enemiesToRemove.add(ei);
          bulletsToRemove.add(bi);
        }
      });
    });
  
    // 3) Filter out hit bullets & enemies
    bullets = bullets.filter((_, i) => !bulletsToRemove.has(i));
    enemies = enemies.filter((_, i) => !enemiesToRemove.has(i));
  
    // 4) Check collisions with player and off‐screen:
    enemies = enemies.filter(enemy => {
      // Hit the player?
      if (checkCollision(enemy, player)) {
        if (player.hasShield) {
          player.hasShield = false;
          return false;       // remove the shielded‐off enemy
        } else {
          gameOver = true;
          return false;
        }
      }
      // Fell past bottom?
      if (enemy.y > canvas.height + 20) {
        return false;
      }
      return true;           // all clear: keep this enemy
    });
  
    // 5) Level‐complete or game‐over if none left
    if (enemies.length === 0) {
      if (enemiesKilled >= enemiesRequired) {
        showLevelComplete();
      } else {
        gameOver = true;
      }
    }
  }  
  
  

function drawEnemies() {
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + 20);
        ctx.lineTo(enemy.x - 15, enemy.y - 10);
        ctx.lineTo(enemy.x + 15, enemy.y - 10);
        ctx.closePath();
        ctx.fill();
    });
}

function checkCollision(obj1, obj2) {
    return Math.abs(obj1.x - obj2.x) < 20 && Math.abs(obj1.y - obj2.y) < 20;
}

function drawStartScreen() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Space Shooter', canvas.width/2, 60);
    
    // Controls section
    ctx.font = '18px Arial';
    ctx.fillText('Controls:', canvas.width/2, 100);
    
    // Controls in two columns
    ctx.textAlign = 'right';
    ctx.fillText('Left/Right Arrow:', canvas.width/2 - 10, 130);
    ctx.fillText('Spacebar:', canvas.width/2 - 10, 155);
    ctx.fillText('Click:', canvas.width/2 - 10, 180);
    
    ctx.textAlign = 'left';
    ctx.fillText('Move', canvas.width/2 + 10, 130);
    ctx.fillText('Shoot', canvas.width/2 + 10, 155);
    ctx.fillText('Select Level/Restart', canvas.width/2 + 10, 180);

    // Power-ups section
    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText('Power-ups:', canvas.width/2, 220);
    
    // Power-ups in three columns
    const columnWidth = canvas.width / 3;
    
    // Speed Boost
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('● Speed Boost', columnWidth/2, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('+50% Speed', columnWidth/2, 270);
    ctx.fillText('5 seconds', columnWidth/2, 285);
    
    // Firepower
    ctx.fillStyle = '#ff00ff';
    ctx.font = '18px Arial';
    ctx.fillText('● Firepower', columnWidth + columnWidth/2, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Extra Bullets', columnWidth + columnWidth/2, 270);
    ctx.fillText('Permanent', columnWidth + columnWidth/2, 285);
    
    // Shield
    ctx.fillStyle = '#ffff00';
    ctx.font = '18px Arial';
    ctx.fillText('● Shield', columnWidth * 2 + columnWidth/2, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('One Hit', columnWidth * 2 + columnWidth/2, 270);
    ctx.fillText('Protection', columnWidth * 2 + columnWidth/2, 285);

    // Power-downs section
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Power-downs:', canvas.width/2, 320);
    
    // Slow
    ctx.fillStyle = '#ff0000';
    ctx.fillText('● Slow', columnWidth/2, 350);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('-50% Speed', columnWidth/2, 370);
    ctx.fillText('3 seconds', columnWidth/2, 385);
    
    // Freeze
    ctx.fillStyle = '#0000ff';
    ctx.font = '18px Arial';
    ctx.fillText('● Freeze', columnWidth + columnWidth/2, 350);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('No Movement', columnWidth + columnWidth/2, 370);
    ctx.fillText('2 seconds', columnWidth + columnWidth/2, 385);
    
    // Screen Shake
    ctx.fillStyle = '#ff8800';
    ctx.font = '18px Arial';
    ctx.fillText('● Screen Shake', columnWidth * 2 + columnWidth/2, 350);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Hard to Aim', columnWidth * 2 + columnWidth/2, 370);
    ctx.fillText('4 seconds', columnWidth * 2 + columnWidth/2, 385);

    // Start prompt
    ctx.fillStyle = '#00ff00';
    ctx.font = '24px Arial';
    ctx.fillText('Click to Select Level', canvas.width/2, 420);
}

function gameLoop() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        if (player.screenShake > 0) {
            player.screenShake -= 16;
            ctx.translate(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
        }

        updatePlayer();
        updateBullets();
        updateEnemies();
        updatePowerUps();
        updateNotifications();

        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPowerUps();
        drawNotifications();

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 30);
        ctx.fillText('Level: ' + currentLevel, 20, 60);
        ctx.fillText('Enemies: ' + enemiesKilled + '/' + enemiesRequired, 20, 90);
        
        if (player.hasShield) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('Shield Active!', 20, 120);
        }
        if (player.isFrozen) {
            ctx.fillStyle = '#0000ff';
            ctx.fillText('Frozen!', 20, 150);
        }
        if (player.screenShake > 0) {
            ctx.fillStyle = '#ff8800';
            ctx.fillText('Screen Shaking!', 20, 180);
        }

        if (player.screenShake > 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (gameOver) {
            gameState = 'gameOver';
            levelSelect.style.display = 'block';
        }
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.fillText('Final Score: ' + score, canvas.width/2, canvas.height/2 + 50);
        ctx.fillText('Click to select level', canvas.width/2, canvas.height/2 + 100);
    }

    requestAnimationFrame(gameLoop);
}

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState === 'playing') {
        shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', () => {
    if (gameState === 'start') {
        gameState = 'levelSelect';
        levelSelect.style.display = 'block';
    } else if (gameState === 'gameOver') {
        gameState = 'levelSelect';
        levelSelect.style.display = 'block';
        levelComplete.style.display = 'none';
    } else if (gameState === 'levelComplete') {
        gameState = 'levelSelect';
        levelSelect.style.display = 'block';
        levelComplete.style.display = 'none';
    }
});

// Initialize game state
gameState = 'start';
levelSelect.style.display = 'none';
levelComplete.style.display = 'none';

// Start the game
gameLoop();
