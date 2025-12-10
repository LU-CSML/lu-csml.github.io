"""
CSML Logo Generator

Generates the 'Banana' distribution logo for the CSML website.
The mathematical shape closely resembles the 'Banana' distribution used in
MCMC benchmarks (e.g., Haario et al., 1999).

Mathematical Definition:
x = -0.5 * y^2 + N(0, 0.15)
y = N(0, 1.2)
"""

import argparse
import sys
from typing import Tuple

import matplotlib.pyplot as plt
import numpy as np


def generate_banana_data(
    n_samples: int = 50000, 
    curvature: float = -0.5, 
    variance_y: float = 1.2,
    variance_x: float = 0.15
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate samples from a warped Gaussian distribution ('Banana' shape).
    
    Args:
        n_samples: Number of points to generate
        curvature: Coefficient for the quadratic warping (controls curve direction)
        variance_y: Standard deviation of the vertical spread
        variance_x: Standard deviation of the horizontal noise (band thickness)
        
    Returns:
        Tuple of (x, y) coordinate arrays
    """
    # Vertical spread: y ~ N(0, 1.2^2)
    y = np.random.normal(0, variance_y, n_samples)
    
    # Horizontal thickness noise: x_noise ~ N(0, 0.15^2)
    x_noise = np.random.normal(0, variance_x, n_samples)
    
    # Relationship: x depends quadratically on y
    # x = a*y^2 + noise
    x = curvature * (y**2) + x_noise
    
    return x, y


def save_logo(output_path: str, dpi: int = 300) -> None:
    """
    Generate and save the logo image.

    Args:
        output_path: File path for the output image
        dpi: Resolution for the output image
    """
    np.random.seed(42)
    x, y = generate_banana_data()

    # Create figure without frame
    plt.figure(figsize=(8, 8))
    
    # Official CSML Golden Orange
    color = '#F4A500' 
    
    # Plot scatter with high transparency for density effect
    plt.scatter(x, y, s=0.5, c=color, alpha=0.4, edgecolors='none')
    
    # Ensure physical aspect ratio matches data aspect ratio
    plt.gca().set_aspect('equal', adjustable='box')
    plt.axis('off')
    
    try:
        plt.savefig(output_path, dpi=dpi, transparent=True, bbox_inches='tight', pad_inches=0.1)
        print(f"Success: Logo generated at '{output_path}'")
    except IOError as e:
        print(f"Error: Failed to save logo to '{output_path}'. {e}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the CSML 'Banana' distribution logo.")
    parser.add_argument(
        '--output', '-o', 
        default='csml_icon_high_res.png',
        help="Output file path (default: csml_icon_high_res.png)"
    )
    parser.add_argument(
        '--dpi', 
        type=int, 
        default=300,
        help="DPI resolution (default: 300)"
    )
    
    args = parser.parse_args()
    save_logo(args.output, args.dpi)


if __name__ == "__main__":
    main()
