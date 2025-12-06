import numpy as np
import matplotlib.pyplot as plt

def generate_banana_data(n_samples=50000, curvature=-0.5, variance=0.1):
    # Standard 2D Gaussian latent variables adapted for banana shape
    # We want a shape like the letter 'C' facing left (opening left) or right?
    # Looking at the user image:
    # Top-left to Bottom-left arc? 
    # Wait, the image provided 
    # It starts top-left, curves down-right, then curves down-left (like a C shape opening to the LEFT).
    # Its vertex is on the Right.
    # So x = -y^2 (roughly).
    
    y = np.random.normal(0, 1.2, n_samples) # Vertical spread
    x_noise = np.random.normal(0, 0.15, n_samples) # Thickness of the band
    
    # x = -y^2
    x = -0.5 * (y**2) + x_noise
    
    return x, y

def save_logo():
    np.random.seed(42)
    x, y = generate_banana_data()

    # Create figure
    plt.figure(figsize=(8, 8))
    
    # Color: Golden Orange
    # Hex from roughly eyedropping the original: #E69F00 or #F0A500
    color = '#F4A500' 
    
    # Plot
    # s=0.5 for fine grain
    plt.scatter(x, y, s=0.5, c=color, alpha=0.4, edgecolors='none')
    
    # Aspect ratio equal to keep it looking like the distribution
    plt.gca().set_aspect('equal', adjustable='box')
    
    plt.axis('off')
    
    output_path = 'csml_icon_high_res.png'
    plt.savefig(output_path, dpi=300, transparent=True, bbox_inches='tight', pad_inches=0.1)
    print(f"Generated {output_path}")

if __name__ == "__main__":
    save_logo()
