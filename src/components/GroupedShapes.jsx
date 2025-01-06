import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

function FirstShapeRenderer({ shape }) {
  const [xScale, setXScale] = useState(1); // Initial scale for X-axis
  const [zScale, setZScale] = useState(1); // Initial scale for Z-axis
  const [isShapeActive, setIsShapeActive] = useState(false); // Track if shape is active
  const containerRef = useRef();

  // Extract clusters from the first shape
  const clusters = shape?.clusters || [];
  const sideId = shape?.sideId || "top-down";

  // Convert the clusters into Vector3 points using x, y, and z values
  const points = clusters.map(
    (item) => new THREE.Vector3(item.x, item.y, item.z)
  );

  // Create a buffer geometry to represent the shape
  const geometry = new THREE.BufferGeometry();

  // Flatten the points array for BufferGeometry
  const vertices = new Float32Array(points.length * 3);
  points.forEach((point, index) => {
    vertices[index * 3] = point.x;
    vertices[index * 3 + 1] = point.y;
    vertices[index * 3 + 2] = point.z;
  });

  // Set the vertices attribute on the geometry
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

  // Create faces to "fill" the shape. We will create triangles by connecting adjacent points.
  const indices = [];
  for (let i = 1; i < points.length - 1; i++) {
    indices.push(0, i, i + 1);
  }
  indices.push(0, points.length - 2, points.length - 1);

  geometry.setIndex(indices);

  // Create a material to visualize the mesh
  const material = new THREE.MeshBasicMaterial({
    color: "blue",
    side: THREE.DoubleSide,
    wireframe: true,
  });

  // Create the shape mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Calculate the initial bounding box to find the current position of the shape
  let boundingBox = new THREE.Box3().setFromObject(mesh);
  let center = boundingBox.getCenter(new THREE.Vector3());

  // Scale the shape dynamically based on state
  mesh.scale.set(xScale, 1, zScale);

  // Recalculate the bounding box after scaling
  boundingBox = new THREE.Box3().setFromObject(mesh);

  // For "top-down" scaling, starting from the initial X position (left to right)
  if (sideId === "top-down") {
    // Get the initial X position (left side) of the shape before scaling
    const initialXPosition = boundingBox.min.x;

    // Offset the position so the shape starts scaling from the initial X position
    mesh.position.x = initialXPosition; // This keeps the left side fixed

    // Now apply the scaling (it will grow from left to right)
  }

  // For "left-right" scaling (optional, for consistency or other directions)
  else {
    // Get the initial Z position (left side) of the bounding box
    const initialZPosition = boundingBox.min.z;

    // Offset the position so the shape starts scaling from the initial Z position
    mesh.position.z = initialZPosition;
  }

  // Recalculate the bounding box and center the mesh after scaling
  const newBoundingBox = new THREE.Box3().setFromObject(mesh);
  const newCenter = newBoundingBox.getCenter(new THREE.Vector3());

  // Offset the mesh to keep it centered after scaling
  mesh.position.sub(newCenter).add(center);

  // Handle click event on the shape
  const handleShapeClick = () => {
    setIsShapeActive(true); // Activate shape
  };

  // Handle click outside of the shape/UI
  const handleClickOutside = (event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsShapeActive(false); // Deactivate shape if clicked outside
    }
  };

  useEffect(() => {
    if (isShapeActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShapeActive]);

  // Handle scale input changes
  const handleXScaleChange = (e) => {
    setXScale(parseFloat(e.target.value));
  };

  const handleZScaleChange = (e) => {
    setZScale(parseFloat(e.target.value));
  };

  return (
    <>
      <primitive object={mesh} onClick={handleShapeClick}></primitive>
      {isShapeActive && (
        <Html
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <div ref={containerRef}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "5px", color: "black" }}>
                X-Axis Scale:
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={xScale}
                onChange={handleXScaleChange}
                style={{
                  padding: "5px",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ marginRight: "5px", color: "black" }}>
                Z-Axis Scale:
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={zScale}
                onChange={handleZScaleChange}
                style={{
                  padding: "5px",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

export default FirstShapeRenderer;
