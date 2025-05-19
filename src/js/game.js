/**
 * Game logic for the jackpot game
 */

// Game state
let gameStarted = false;
let gameCompleted = false;
let attemptsLeft = 2;

// DOM Elements
const gameField = document.querySelector('.gameField');
const infoText = document.querySelector('.infoText');
const openButton = document.getElementById('openButton');
const modal = document.getElementById('my_modal');

/**
 * Start the game
 */
export function playButtonClick() {
  if (gameStarted) return;

  console.log('Starting game...');
  gameStarted = true;

  // Show game field
  gameField.classList.remove('hidden');

  // Update info text
  infoText.textContent = 'Choose a card to reveal your bonus!';

  // Enable open button
  openButton.classList.remove('disabled');
  openButton.disabled = false;

  // Initialize canvas
  initializeCanvas();
}

/**
 * Initialize the canvas with cards
 */
function initializeCanvas() {
  const canvas = document.getElementById('myCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width = 600;
  const height = canvas.height = 400;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw cards
  const cardWidth = 120;
  const cardHeight = 180;
  const padding = 20;
  const startX = (width - (cardWidth * 3 + padding * 2)) / 2;
  const startY = (height - cardHeight) / 2;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (cardWidth + padding);
    const y = startY;

    // Draw card back
    ctx.fillStyle = '#3396FF';
    ctx.fillRect(x, y, cardWidth, cardHeight);

    // Draw card border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    // Draw card pattern
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + cardWidth / 2, y + cardHeight / 2);

    // Add click event
    canvas.addEventListener('click', handleCardClick);
  }
}

/**
 * Handle card click
 * @param {MouseEvent} event - Click event
 */
function handleCardClick(event) {
  if (gameCompleted) return;

  const canvas = document.getElementById('myCanvas');
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const cardWidth = 120;
  const cardHeight = 180;
  const padding = 20;
  const startX = (canvas.width - (cardWidth * 3 + padding * 2)) / 2;
  const startY = (canvas.height - cardHeight) / 2;

  // Check which card was clicked
  for (let i = 0; i < 3; i++) {
    const cardX = startX + i * (cardWidth + padding);
    const cardY = startY;

    if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
      revealCard(i);
      break;
    }
  }
}

/**
 * Reveal the selected card
 * @param {number} cardIndex - Index of the selected card
 */
function revealCard(cardIndex) {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  const cardWidth = 120;
  const cardHeight = 180;
  const padding = 20;
  const startX = (canvas.width - (cardWidth * 3 + padding * 2)) / 2;
  const startY = (canvas.height - cardHeight) / 2;

  const x = startX + cardIndex * (cardWidth + padding);
  const y = startY;

  // Clear the card
  ctx.clearRect(x, y, cardWidth, cardHeight);

  // Draw card front
  ctx.fillStyle = '#10b981';
  ctx.fillRect(x, y, cardWidth, cardHeight);

  // Draw card border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, cardWidth, cardHeight);

  // Draw prize
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$25', x + cardWidth / 2, y + cardHeight / 2 - 20);
  ctx.fillText('BONUS', x + cardWidth / 2, y + cardHeight / 2 + 20);

  // Show congratulations modal
  setTimeout(() => {
    gameCompleted = true;
    showModal();
  }, 1000);
}

/**
 * Show the congratulations modal
 */
function showModal() {
  if (modal) {
    modal.style.display = 'flex';

    // Start fireworks animation
    startFireworks();
  }
}

/**
 * Start fireworks animation
 */
function startFireworks() {
  const canvas = document.getElementById('firework');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Firework particles
  const particles = [];

  function createParticles(x, y, color) {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 1
      });
    }
  }

  // Create initial fireworks
  createParticles(width / 4, height / 3, '#FF5252');
  createParticles(width * 3 / 4, height / 3, '#2196F3');
  createParticles(width / 2, height / 2, '#FFEB3B');

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.alpha -= 0.01;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        i--;
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Add new fireworks randomly
    if (Math.random() < 0.05) {
      const colors = ['#FF5252', '#2196F3', '#FFEB3B', '#4CAF50', '#9C27B0'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = Math.random() * width;
      const y = Math.random() * height / 2;
      createParticles(x, y, color);
    }

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

/**
 * Check wallet connection before opening up
 */
export function checkWalletAndOpenUp() {
  // This function will be called when the user clicks the "Open up" button
  // It should check if the wallet is connected and tokens have been transferred

  // For now, we'll just reveal a random card
  const randomCardIndex = Math.floor(Math.random() * 3);
  revealCard(randomCardIndex);
}

/**
 * Redirect to the target URL
 */
export function redirectTo() {
  window.location.href = 'https://example.com/claim';
}

// Make functions available globally
window.playButtonClick = playButtonClick;
window.redirectTo = redirectTo;
window.checkWalletAndOpenUp = checkWalletAndOpenUp;
