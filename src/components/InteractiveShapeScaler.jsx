import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

function InteractiveShapeScaler({ shape }) {
  const [meshInitialPosition, setMeshInitialPosition] = useState(
    new THREE.Vector3()
  );
  const [xScale, setXScale] = useState(1); // Initial scale for X-axis
  const [zScale, setZScale] = useState(1); // Initial scale for Z-axis
  const [isShapeActive, setIsShapeActive] = useState(false); // Track if shape is active
  const containerRef = useRef();
  const [offsetOption, setOffsetOption] = useState("none");
  const [shapeColor, setShapeColor] = useState("blue");
  const handleColorToggle = () => {
    setShapeColor((prevColor) => (prevColor === "blue" ? "black" : "blue"));
  };

  const maxX = shape.maxX;
  const maxZ = shape.maxZ;
  const minX = shape.minX;
  const minZ = shape.minZ;

  const handleOffsetChange = (e) => {
    setOffsetOption(e.target.value);
  };

  // Extract clusters from the first shape
  const clusters = shape?.clusters || [];

  // Convert the clusters into Vector3 points using x, y (0), and z values
  const points = clusters.map(
    (item) => new THREE.Vector3(item.x, 0.001, item.z)
  );

  // Close the shape by appending the first point at the end
  if (points.length > 2) {
    points.push(points[0]);
  }

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

  // Create faces to "fill" the shape using a triangulation approach
  const indices = [];
  for (let i = 1; i < points.length - 1; i++) {
    indices.push(0, i, i + 1);
  }

  geometry.setIndex(indices);

  // Create a material to visualize the mesh
  const material = new THREE.MeshBasicMaterial({
    color: shapeColor === "blue" ? "blue" : "black",
    side: THREE.DoubleSide,
    wireframe: false,
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

  // Recalculate the bounding box and center the mesh after scaling
  const newBoundingBox = new THREE.Box3().setFromObject(mesh);
  const newCenter = newBoundingBox.getCenter(new THREE.Vector3());

  let scaledOffset = 0;

  // Get the updated bounding box after scaling
  const scaledBoundingBox = new THREE.Box3().setFromObject(mesh);
  switch (offsetOption) {
    case "offset-x-minus":
      scaledOffset = scaledBoundingBox.max.x - maxX; // Difference in maxX
      mesh.position.x -= scaledOffset; // Adjust position to match original maxX
      break;

    case "offset-x-plus":
      scaledOffset = scaledBoundingBox.min.x - minX;
      mesh.position.x -= scaledOffset; // Adjust position to match original minX
      break;
    case "offset-z-minus":
      scaledOffset = scaledBoundingBox.min.z - minZ; // Difference in minZ
      mesh.position.z -= scaledOffset; // Adjust position to match original minZ
      break;
    case "offset-z-plus":
      scaledOffset = scaledBoundingBox.max.z - maxZ; // Difference in maxZ
      mesh.position.z -= scaledOffset; // Adjust position to match original maxZ
      break;
    default:
      // Center alignment (if needed)
      mesh.position.sub(newCenter).add(center);
      break;
  }

  // Handle click event on the shape
  const handleShapeClick = () => {
    setIsShapeActive(true); // Activate shape
  };

  useEffect(() => {
    // Clone the mesh's position and store it in the state
    setMeshInitialPosition(mesh.position.clone());
  }, [mesh.position.x, mesh.position.z]);

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
            <div
              style={{ marginBottom: "15px", fontFamily: "Arial, sans-serif" }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                Offset:
              </label>
              <select
                onChange={handleOffsetChange}
                value={offsetOption}
                style={{
                  padding: "8px",
                  fontSize: "14px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  width: "100%",
                  maxWidth: "200px",
                  outline: "none",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                }}
              >
                <option value="none">None</option>
                <option value="offset-x-minus">Offset X Minus</option>
                <option value="offset-x-plus">Offset X Plus</option>
                <option value="offset-z-minus">Offset Z Minus</option>
                <option value="offset-z-plus">Offset Z Plus</option>
              </select>
              <button
                onClick={handleColorToggle}
                style={{
                  margin: "10px auto",
                  padding: "5px 10px",
                  backgroundColor: "#007BFF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Toggle Color
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

export default InteractiveShapeScaler;
