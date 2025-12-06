(function() {
    const canvas = document.createElement('canvas');
    const container = document.getElementById('hero-canvas-container');
    
    if (!container) return;
    
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Banana Parameters
    const N_PARTICLES = 15000;
    const particles = new Float32Array(N_PARTICLES * 2); // x, y interleaved
    const speeds = new Float32Array(N_PARTICLES); // speed for breathing effect
    
    // Initialize Particles along the Banana distribution
    function initParticles() {
        for (let i = 0; i < N_PARTICLES; i++) {
            // Generate standard banana: x = -0.5*y^2 + noise
            // We want it centered.
            
            // Vertical spread (Y)
            let y = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.5; // Approx normal
            
            // Thickness noise
            let noise = (Math.random() + Math.random() - 1) * 0.2;
            
            // Equation x = -c * y^2
            let x = -0.6 * (y * y) + noise;
            
            // Shift x to center usage
            // The vertex is at 0, curve goes left. Center of mass is roughly -0.6.
            x += 0.5;
            
            particles[i * 2] = x;
            particles[i * 2 + 1] = y;
            speeds[i] = 0.002 + Math.random() * 0.003; // Random breathing speed
        }
    }
    
    function resize() {
        width = container.offsetWidth;
        height = container.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }
    
    let time = 0;
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Scale factor to fit screen
        const scale = Math.min(width, height) / 4;
        
        // Color
        ctx.fillStyle = '#F4A500';
        
        // Global Rotation
        const angle = time * 0.2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        
        for (let i = 0; i < N_PARTICLES; i++) {
            let px = particles[i * 2];
            let py = particles[i * 2 + 1];
            
            // Breathing effect: slight expansion/contraction
            // const breathe = 1 + Math.sin(time * 2 + px * 2) * 0.05;
            // px *= breathe;
            // py *= breathe;
            
            // Rotate
            // x_new = x * cos - y * sin
            // y_new = x * sin + y * cos
            let rx = px * cosA - py * sinA;
            let ry = px * sinA + py * cosA;
            
            // Project to screen
            let screenX = centerX + rx * scale;
            let screenY = centerY + ry * scale;
            
            // Draw pixel
            ctx.fillRect(screenX, screenY, 1.5, 1.5);
        }
        
        time += 0.01;
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', resize);
    
    initParticles();
    resize();
    animate();
})();
