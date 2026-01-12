(function() {
    const canvas = document.createElement('canvas');
    const container = document.getElementById('hero-canvas-container');
    
    if (!container) return;
    
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Dynamic Particle Count: Reduce for mobile to save battery/CPU
    const isMobile = window.innerWidth < 768;
    const N_PARTICLES = isMobile ? 4000 : 15000;
    
    const particles = new Float32Array(N_PARTICLES * 2); // x, y interleaved
    const speeds = new Float32Array(N_PARTICLES); // speed for breathing effect
    
    /**
     * Initializes particles along a "banana" (curved) distribution.
     * 
     * MATHEMATICAL BACKGROUND:
     * 
     * 1. IRWIN-HALL DISTRIBUTION (Approximate Gaussian):
     *    The sum of n uniform random variables U(0,1) approximates a Gaussian.
     *    Here we use n=4: Y = (U1 + U2 + U3 + U4 - 2) * 1.5
     *    Mean = 0, Std ≈ 1.5 * sqrt(4/12) ≈ 0.87
     *    
     * 2. BANANA (ROSENBROCK) CURVE:
     *    The classic "banana" shape follows: x = -c * y²
     *    With c=0.6, this creates a parabola opening leftward.
     *    Gaussian noise (σ=0.2) is added for thickness.
     *    
     * 3. 2D ROTATION MATRIX (applied in animate()):
     *    [x']   [cos(θ)  -sin(θ)] [x]
     *    [y'] = [sin(θ)   cos(θ)] [y]
     *    
     * Reference: https://en.wikipedia.org/wiki/Irwin%E2%80%93Hall_distribution
     */
    function initParticles() {
        for (let i = 0; i < N_PARTICLES; i++) {
            // Irwin-Hall n=4: sum of 4 uniforms ≈ Gaussian (Central Limit Theorem)
            // Subtract 2 to center at 0, scale by 1.5 for desired spread
            let y = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.5;
            
            // Thickness noise: triangular distribution (sum of 2 uniforms - 1)
            let noise = (Math.random() + Math.random() - 1) * 0.2;
            
            // Banana curve: x = -0.6 * y² (parabola opening left)
            let x = -0.6 * (y * y) + noise;
            
            // Translate to shift center of mass (vertex at origin, COM ≈ -0.6)
            x += 0.5;
            
            particles[i * 2] = x;
            particles[i * 2 + 1] = y;
            speeds[i] = 0.002 + Math.random() * 0.003;
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
    
    // Debounce resize to prevent excessive canvas resizing
    let resizeTimeout;
    function debouncedResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 100);
    }
    
    window.addEventListener('resize', debouncedResize);
    
    initParticles();
    resize();
    animate();
})();
