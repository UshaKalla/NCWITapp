// Drawing state configurations
let drawing = false;
let tool = 'pen';
let color = '#1a1a2e';
let ctx;
let strokes = 0;

/**
 * Interface view coordinator logic
 * Switches viewports manually and maps state tags
 */
function switchScreen(name) {
  // Hide all screens and deactivate active tab button states
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  
  // Show target viewport container
  document.getElementById('screen-' + name).classList.add('active');
  
  // Match corresponding bottom navbar tab if one exists
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  
  if (name === 'draw') {
    // A small delay ensures the browser calculates sizes correctly before configuring canvas paths
    setTimeout(initCanvas, 50);
  }
}

/**
 * Initializes drawing contexts on target canvas structures
 */
function initCanvas() {
  const canvas = document.getElementById('sketchCanvas');
  const container = canvas.parentElement;
  
  // Map vector bounding scales dynamically to ensure precision tracking
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  
  // Guard clause against processing multiple instances of event bindings
  if (canvas._init) return;
  canvas._init = true;
  
  ctx = canvas.getContext('2d');
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Resolves absolute offset mapping for coordinates
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function start(e) { 
    e.preventDefault(); 
    drawing = true; 
    const p = getPos(e); 
    ctx.beginPath(); 
    ctx.moveTo(p.x, p.y); 
  }
  
  function move(e) {
    e.preventDefault();
    if (!drawing) return;
    const p = getPos(e);
    if (tool === 'eraser') { 
      ctx.clearRect(p.x - 12, p.y - 12, 24, 24); 
    } else { 
      ctx.strokeStyle = color; 
      ctx.lineTo(p.x, p.y); 
      ctx.stroke(); 
    }
    strokes++;
    // Throttle rendering evaluations every 6 coordinate updates
    if (strokes % 6 === 0) updateGen();
  }
  
  function end(e) { 
    e.preventDefault(); 
    drawing = false; 
  }

  // Cross-environment viewport capture listeners
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end, { passive: false });
}

/**
 * Simulates real-time preview outputs based on trace activities
 */
function updateGen() {
  const svg = document.getElementById('genPreview');
  const shape = document.getElementById('dress-shape');
  
  // Scale vector visual opacity up slowly as trace counts increase
  const opacity = Math.min(0.15 + strokes * 0.015, 0.95);
  shape.setAttribute('opacity', opacity.toFixed(2));
  
  // Remove contextual instructions text once confidence ratings scale up
  const texts = svg.querySelectorAll('text');
  if (opacity > 0.35) {
    texts.forEach(t => t.style.display = 'none');
  }
}

/**
 * Set active utilities for canvas modification
 */
function setTool(t) {
  tool = t;
  document.getElementById('btn-pen').classList.toggle('active', t === 'pen');
  document.getElementById('btn-eraser').classList.toggle('active', t === 'eraser');
}

/**
 * Set base hex value variables for the canvas stroke style
 */
function setColor(c) { 
  color = c; 
  setTool('pen'); // Automatically fallback out of eraser mode on selecting colors
}

/**
 * Resets local canvas elements and clears active opacity properties
 */
function clearCanvas() {
  const canvas = document.getElementById('sketchCanvas');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = 0;
  
  // Reset standard state levels
  const shape = document.getElementById('dress-shape');
  shape.setAttribute('opacity', '0.15');
  
  const svg = document.getElementById('genPreview');
  svg.querySelectorAll('text').forEach(t => t.style.display = '');
}