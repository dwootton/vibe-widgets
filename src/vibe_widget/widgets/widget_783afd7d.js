import * as THREE from "https://esm.sh/three@r128";

function render({ model, el }) {
  const data = model.get("data");
  
  // Container setup
  el.style.width = "100%";
  el.style.height = "600px";
  el.style.position = "relative";
  el.style.overflow = "hidden";
  
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.position = "relative";
  el.appendChild(container);
  
  // Info panel
  const infoPanel = document.createElement("div");
  infoPanel.style.position = "absolute";
  infoPanel.style.top = "10px";
  infoPanel.style.left = "10px";
  infoPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  infoPanel.style.color = "#fff";
  infoPanel.style.padding = "15px";
  infoPanel.style.borderRadius = "8px";
  infoPanel.style.fontFamily = "Arial, sans-serif";
  infoPanel.style.fontSize = "12px";
  infoPanel.style.zIndex = "100";
  infoPanel.innerHTML = "<b>Solar System</b><br>Click on a planet to view details<br><br>View: <b id='viewMode'>Heliocentric</b>";
  container.appendChild(infoPanel);
  
  // Toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Toggle Perspective";
  toggleBtn.style.position = "absolute";
  toggleBtn.style.bottom = "10px";
  toggleBtn.style.right = "10px";
  toggleBtn.style.padding = "10px 20px";
  toggleBtn.style.backgroundColor = "#4CAF50";
  toggleBtn.style.color = "white";
  toggleBtn.style.border = "none";
  toggleBtn.style.borderRadius = "4px";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.zIndex = "100";
  toggleBtn.style.fontSize = "12px";
  container.appendChild(toggleBtn);
  
  // Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);
  
  // Stars background
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  const starsVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 40000;
    const y = (Math.random() - 0.5) * 40000;
    const z = (Math.random() - 0.5) * 40000;
    starsVertices.push(x, y, z);
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(starsVertices), 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
  
  // Planets data
  const planetsData = [
    { name: "Mercury", size: 0.38, distance: 40, color: 0x8c7853, speed: 0.04 },
    { name: "Venus", size: 0.95, distance: 70, color: 0xffc649, speed: 0.015 },
    { name: "Earth", size: 1, distance: 100, color: 0x4a90e2, speed: 0.01 },
    { name: "Mars", size: 0.53, distance: 130, color: 0xe27b58, speed: 0.008 },
    { name: "Jupiter", size: 11.2, distance: 180, color: 0xc88b3a, speed: 0.002 },
    { name: "Saturn", size: 9.45, distance: 230, color: 0xf4d47f, speed: 0.0009 },
    { name: "Uranus", size: 4.01, distance: 270, color: 0x4fd0e7, speed: 0.0004 },
    { name: "Neptune", size: 3.88, distance: 310, color: 0x4166f5, speed: 0.0001 }
  ];
  
  // Create planets
  const planets = [];
  const orbits = [];
  
  planetsData.forEach(pData => {
    // Planet sphere
    const geometry = new THREE.SphereGeometry(pData.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: pData.color });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = {
      name: pData.name,
      distance: pData.distance,
      speed: pData.speed,
      angle: Math.random() * Math.PI * 2,
      size: pData.size
    };
    scene.add(planet);
    planets.push(planet);
    
    // Orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      orbitPoints.push(
        Math.cos(angle) * pData.distance,
        0,
        Math.sin(angle) * pData.distance
      );
    }
    orbitGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(orbitPoints), 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
    orbits.push(orbit);
  });
  
  // Sun
  const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);
  
  // Lighting
  const light = new THREE.PointLight(0xffffff, 2);
  light.position.set(0, 0, 0);
  scene.add(light);
  
  // Interactive elements
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedPlanet = null;
  let isHeliocentric = true;
  let cameraDistance = 400;
  
  // Info display
  const detailPanel = document.createElement("div");
  detailPanel.style.position = "absolute";
  detailPanel.style.top = "10px";
  detailPanel.style.right = "10px";
  detailPanel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  detailPanel.style.color = "#fff";
  detailPanel.style.padding = "15px";
  detailPanel.style.borderRadius = "8px";
  detailPanel.style.fontFamily = "Arial, sans-serif";
  detailPanel.style.fontSize = "12px";
  detailPanel.style.zIndex = "100";
  detailPanel.style.maxWidth = "200px";
  detailPanel.innerHTML = "Click on a planet";
  container.appendChild(detailPanel);
  
  function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);
    
    if (intersects.length > 0) {
      selectedPlanet = intersects[0].object;
      const name = selectedPlanet.userData.name;
      const distance = selectedPlanet.userData.distance;
      const size = selectedPlanet.userData.size;
      detailPanel.innerHTML = `<b>${name}</b><br>Distance: ${distance}M km<br>Size: ${size}x Earth<br><br>Heliocentric view active`;
    }
  }
  
  renderer.domElement.addEventListener("click", onMouseClick);
  
  toggleBtn.addEventListener("click", () => {
    isHeliocentric = !isHeliocentric;
    document.getElementById("viewMode").textContent = isHeliocentric ? "Heliocentric" : "Geocentric";
  });
  
  // Camera setup
  camera.position.z = cameraDistance;
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    planets.forEach(planet => {
      planet.userData.angle += planet.userData.speed;
      planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
      planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;
      planet.rotation.y += 0.01;
    });
    
    sun.rotation.y += 0.002;
    
    if (selectedPlanet && !isHeliocentric) {
      camera.position.x = selectedPlanet.position.x + 200;
      camera.position.z = selectedPlanet.position.z + 200;
      camera.lookAt(selectedPlanet.position);
    } else {
      camera.position.z = cameraDistance;
      camera.position.x = 0;
      camera.position.y = 0;
      camera.lookAt(0, 0, 0);
    }
    
    renderer.render(scene, camera);
  }
  
  // Handle resize
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  
  animate();
  
  // Cleanup on model change
  model.on("change:data", () => {
    // Update visualization if data changes
  });
}

export default { render };