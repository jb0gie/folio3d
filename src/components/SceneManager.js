import * as THREE from 'three';
import { gsap } from 'gsap';
import TWEEN from '@tweenjs/tween.js';
import { ParticleSystem } from './ParticleSystem';

export class SceneManager {
  constructor() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = null;
    this.panels = new Map();
    this.currentSection = 'home';
    this.sections = ['home', 'work', 'about', 'contact'];
    this.particleSystem = null;
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.createPanels();
    this.setupRaycaster();

    this.particleSystem = new ParticleSystem(this.scene);
    this.particleSystem.init();

    this.animate();
    this.setupEventListeners();

    document.getElementById('loading')?.classList.add('hidden');
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x13151a);

    const container = document.getElementById('canvas-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(this.renderer.domElement);
    }

    this.camera.position.z = 8; // Moved camera back for better view
  }

  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  createTextTexture(text, width = 512, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Background with gradient
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(1, '#1a1a1a');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    // Enhanced glow effect
    context.shadowColor = '#6b46c1';
    context.shadowBlur = 25; // Increased blur

    // Larger text
    context.fillStyle = '#ffffff';
    context.font = 'bold 64px Arial'; // Increased font size
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, width / 2, height / 2);

    // Thicker border with glow
    context.strokeStyle = '#6b46c1';
    context.lineWidth = 8; // Thicker border
    context.strokeRect(10, 10, width - 20, height - 20);

    return new THREE.CanvasTexture(canvas);
  }

  createPanel(text, position) {
    const geometry = new THREE.PlaneGeometry(3, 2); // Larger panels
    const texture = this.createTextTexture(text);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
    });

    const panel = new THREE.Mesh(geometry, material);
    panel.position.copy(position);
    panel.userData.section = text.toLowerCase();
    panel.userData.baseScale = { x: 1, y: 1, z: 1 };
    panel.userData.pulseAnimation = gsap.to(panel.scale, {
      x: 1.05,
      y: 1.05,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    this.scene.add(panel);
    return panel;
  }

  createPanels() {
    const positions = {
      home: new THREE.Vector3(0, 4, 0),
      about: new THREE.Vector3(-6, 0, 0),
      work: new THREE.Vector3(6, 0, 0),
      contact: new THREE.Vector3(0, -4, 0),
    };

    Object.entries(positions).forEach(([section, position]) => {
      this.panels.set(
        section,
        this.createPanel(section.toUpperCase(), position)
      );
    });
  }

  handleClick = (event) => {
    event.preventDefault();
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.userData.section) {
        this.navigateToSection(clickedObject.userData.section);
      }
    }
  };

  handleMouseMove = (event) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  navigateToSection(section) {
    const panel = this.panels.get(section);
    if (!panel) return;

    // Enhanced visual feedback
    gsap.to(panel.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'back.out(1.7)',
    });

    // Camera animation with smoother easing
    const targetPosition = new THREE.Vector3();
    panel.getWorldPosition(targetPosition);

    new TWEEN.Tween(this.camera.position)
      .to(
        {
          x: targetPosition.x,
          y: targetPosition.y,
          z: 8,
        },
        1200
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();

    this.currentSection = section;
    window.location.hash = section;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', this.handleClick);
    this.renderer.domElement.addEventListener(
      'mousemove',
      this.handleMouseMove
    );
  }

  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  checkIntersections() {
    if (!this.raycaster || !this.mouse) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    // Reset all panels
    this.panels.forEach((panel) => {
      if (panel !== intersects[0]?.object) {
        gsap.to(panel.scale, {
          x: 1,
          y: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });

    // Enhanced hover effect
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      if (hoveredObject.userData.section) {
        gsap.to(hoveredObject.scale, {
          x: 1.15,
          y: 1.15,
          duration: 0.3,
          ease: 'power2.out',
        });
        document.body.style.cursor = 'pointer';
      }
    } else {
      document.body.style.cursor = 'default';
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    TWEEN.update();

    if (this.particleSystem) {
      this.particleSystem.update();
    }

    this.checkIntersections();

    // Smoother panel animation
    this.panels.forEach((panel) => {
      panel.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    });

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };
}
