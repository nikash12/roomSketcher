import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';

function MyThree() {
  const refContainer = useRef(null);
  const [roomDimensions, setRoomDimensions] = useState({ length: 5, width: 4, height: 3 });
  const [scene, setScene] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [camera, setCamera] = useState(null);
  const [selectedFurniture, setSelectedFurniture] = useState('');
  const [furnitureList, setFurnitureList] = useState([]);
  const [furnitureModels, setFurnitureModels] = useState([]);
  const dragControlsRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    refContainer.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    camera.position.set(0, 2, 8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    setScene(scene);
    setCamera(camera);
    setRenderer(renderer);

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (refContainer.current) {
        refContainer.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    if (scene) {
      // Clear previous objects
      while (scene.children.length > 3) { // Keep lights intact
        scene.remove(scene.children[3]);
      }

      // Re-add room with new dimensions
      const roomGeometry = new THREE.BoxGeometry(roomDimensions.length, roomDimensions.height, roomDimensions.width);
      const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.BackSide });
      const room = new THREE.Mesh(roomGeometry, roomMaterial);
      scene.add(room);

      // Rearrange furniture after room dimension change
      rearrangeFurniture();
    }
  }, [roomDimensions, scene]);

  useEffect(() => {
    if (scene && furnitureModels.length) {
      const dragControls = new DragControls(furnitureModels, camera, renderer.domElement);
      dragControlsRef.current = dragControls;

      dragControls.addEventListener('dragstart', (event) => {
        event.object.material.emissive.set(0xaaaaaa); // Highlight the object during drag
      });

      dragControls.addEventListener('dragend', (event) => {
        event.object.material.emissive.set(0x000000); // Remove highlight after drag
      });

      return () => {
        dragControls.dispose();
      };
    }
  }, [scene, furnitureModels]);

  const rearrangeFurniture = () => {
    // Clear previous models from the scene
    while (scene.children.length > 3) { // Keep lights intact
      scene.remove(scene.children[3]);
    }

    // Calculate new positions for all furniture
    const positions = {};
    const newFurnitureModels = [];
    furnitureList.forEach(furniture => {
      const dimensions = getModelDimensions(furniture.path);
      const position = findFurniturePosition(dimensions, furnitureList); // Check against current furniture list

      if (position) {
        positions[furniture.path] = position;
        loadModel(furniture.path, position, newFurnitureModels);
      } else {
        console.warn(`Not enough space to position ${furniture.path}.`);
      }
    });

    setFurnitureModels(newFurnitureModels);
  };

  const loadModel = (modelPath, position, newFurnitureModels) => {
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      model.scale.set(0.5, 0.5, 0.5); // Scale the model if necessary
      scene.add(model);
      newFurnitureModels.push(model);
    }, undefined, (error) => {
      console.error('An error occurred loading the model:', error);
    });
  };

  const handleAddFurniture = () => {
    if (selectedFurniture) {
      const modelPath = selectedFurniture;
      const dimensions = getModelDimensions(modelPath);

      if (dimensions) {
        const position = findFurniturePosition(dimensions, furnitureList); // Check against current furniture list
        if (position) {
          setFurnitureList(prev => [...prev, { path: modelPath, position }]);
          loadModel(modelPath, position, [...furnitureModels]);
        } else {
          alert("Not enough space to place the furniture.");
        }
      } else {
        alert("Could not retrieve dimensions for the selected furniture.");
      }
    } else {
      alert("Please select a furniture item.");
    }
  };

  const getModelDimensions = (modelPath) => {
    const dimensions = {
      "/models/chair.glb": { width: 1.0, height: 1.0, depth: 0.5 },
      "/models/bed.glb": { width: 1.5, height: 1.0, depth: 2.0 },
      "/models/table.glb": { width: 1.0, height: 0.75, depth: 1.5 },
    };
    return dimensions[modelPath];
  };

  const findFurniturePosition = (dimensions, occupiedPositions) => {
    const positions = [];
    for (let x = -roomDimensions.length / 2; x < roomDimensions.length / 2; x += dimensions.width + 0.1) {
      for (let z = -roomDimensions.width / 2; z < roomDimensions.width / 2; z += dimensions.depth + 0.1) {
        const isOccupied = occupiedPositions.some(furniture => {
          const fDimensions = getModelDimensions(furniture.path);
          const occupiedX = furniture.position.x;
          const occupiedZ = furniture.position.z;
          return (
            (x < occupiedX + fDimensions.width / 2 && x + dimensions.width > occupiedX - fDimensions.width / 2) &&
            (z < occupiedZ + fDimensions.depth / 2 && z + dimensions.depth > occupiedZ - fDimensions.depth / 2)
          );
        });

        if (!isOccupied) {
          positions.push({ x: x + dimensions.width / 2, y: 0, z: z + dimensions.depth / 2 });
        }
      }
    }

    positions.sort((a, b) => Math.abs(a.x) + Math.abs(a.z) - (Math.abs(b.x) + Math.abs(b.z)));
    return positions[0] || null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const feetToMeters = (val) => val * 0.3048; // Convert feet to meters for Three.js
    setRoomDimensions(prev => ({
      ...prev,
      [name]: feetToMeters(Number(value))
    }));
  };

  const handleFurnitureSelect = (e) => {
    setSelectedFurniture(e.target.value);
  };

  return (
    <div>
      <div ref={refContainer} style={{ width: '100%', height: '100vh' }}></div>
      
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '5px' }}>
        <h3>Room Dimensions (in feet)</h3>
        <label>
          Length:
          <input type="number" name="length" onChange={handleInputChange} />
        </label>
        <br />
        <label>
          Width:
          <input type="number" name="width" onChange={handleInputChange} />
        </label>
        <br />
        <label>
          Height:
          <input type="number" name="height" onChange={handleInputChange} />
        </label>
        <br />
        
        <h3>Select Furniture</h3>
        <select value={selectedFurniture} onChange={handleFurnitureSelect}>
          <option value="">Select furniture</option>
          <option value="/models/chair.glb">Chair</option>
          <option value="/models/bed.glb">Bed</option>
          <option value="/models/table.glb">Table</option>
        </select>
        <br />
        
        <button onClick={handleAddFurniture}>Add Furniture</button>
      </div>
    </div>
  );
}

export default MyThree;
