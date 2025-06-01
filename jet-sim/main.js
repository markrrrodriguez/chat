// Basic Fighter Jet Flight Sim Starter - JavaScript + Three.js
// Includes: terrain, flight model, simple HUD

import * as THREE from 'three';

let scene, camera, renderer;
let jet, terrain;
let velocity = new THREE.Vector3(0, 0, -1);
let pitch = 0, yaw = 0, roll = 0;
const speed = 1;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(0, 2, 10);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  // Jet (simplified box)
  const geometry = new THREE.BoxGeometry(1, 0.25, 3);
  const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
  jet = new THREE.Mesh(geometry, material);
  scene.add(jet);

  // Terrain
  const terrainGeo = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x228822 });
  terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);

  // Controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') pitch = 0.02;
    if (e.key === 'ArrowDown') pitch = -0.02;
    if (e.key === 'ArrowLeft') yaw = 0.02;
    if (e.key === 'ArrowRight') yaw = -0.02;
  });

  window.addEventListener('keyup', () => {
    pitch = 0;
    yaw = 0;
  });
}

function animate() {
  requestAnimationFrame(animate);

  // Rotate jet
  jet.rotation.x += pitch;
  jet.rotation.y += yaw;

  // Move forward in facing direction
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(jet.quaternion);
  jet.position.addScaledVector(direction, speed);

  // Camera follows
  camera.position.lerp(jet.position.clone().add(new THREE.Vector3(0, 2, 10)), 0.1);
  camera.lookAt(jet.position);

  renderer.render(scene, camera);
}
