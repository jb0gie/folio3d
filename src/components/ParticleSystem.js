import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particleCount = 1000;
  }

  init() {
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      // Position
      positions[i] = (Math.random() - 0.5) * 20;      // x
      positions[i + 1] = (Math.random() - 0.5) * 20;  // y
      positions[i + 2] = (Math.random() - 0.5) * 20;  // z
      
      // Velocity
      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    // Create particle material
    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x6b46c1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    // Create particle system
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update() {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Update positions based on velocity
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];

      // Wrap particles around when they go too far
      for (let j = 0; j < 3; j++) {
        if (positions[i + j] > 10) positions[i + j] = -10;
        if (positions[i + j] < -10) positions[i + j] = 10;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    
    // Slowly rotate the entire particle system
    this.particles.rotation.y += 0.0005;
    this.particles.rotation.x += 0.0002;
  }
}