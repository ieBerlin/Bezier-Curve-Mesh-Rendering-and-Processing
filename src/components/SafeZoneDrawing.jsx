import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

const SafeZoneDrawing = ({
  controlsEnabled,
  resetDrawing,
  drawingMode,
  clearAllDesigns,
}) => {
  const [points, setPoints] = useState([]);
  const [isShapeClosed, setIsShapeClosed] = useState(false);
  const [allDrawings, setAllDrawings] = useState([]);
  const [selectedShapeIndices, setSelectedShapeIndices] = useState([]);
  const { camera } = useThree();

  const createCurvedLineGeometry = (points) => {
    if (points.length < 2) return null;

    const curvePoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const control = new THREE.Vector3(
        (start.x + end.x) / 2,
        0.02,
        (start.z + end.z) / 2
      );

      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      curvePoints.push(...curve.getPoints(20));
    }

    if (isShapeClosed) {
      const start = points[points.length - 1];
      const end = points[0];
      const control = new THREE.Vector3(
        (start.x + end.x) / 2,
        0.02,
        (start.z + end.z) / 2
      );

      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      curvePoints.push(...curve.getPoints(20));
    }

    return new THREE.BufferGeometry().setFromPoints(curvePoints);
  };

  const handleClick = (event) => {
    if (!controlsEnabled && !isShapeClosed && drawingMode && !isDragging) {
      const [x, y, z] = event.point.toArray();
      const newPoint = new THREE.Vector3(x, 0.01, z);

      if (points.length === 0) {
        // When the first point is added, immediately set both points and control points
        setPoints([newPoint]);

        // Create a dummy control point initially
        const dummyControlPoint = new THREE.Vector3(
          newPoint.x + 1, // Slight offset to make it visible
          0.02,
          newPoint.z + 1
        );
        setControlPoints([dummyControlPoint]);
        return;
      }

      if (points.length >= 2) {
        const firstPoint = points[0];
        const distance = newPoint.distanceTo(firstPoint);

        if (points.length >= 3 && distance < 1) {
          // Close the shape without adding an extra point
          const area = calculateCurvedArea(points, calculateMidpoints(points));

          setPoints(points); // Keep original points without adding first point again
          setControlPoints(calculateMidpoints(points));
          setIsShapeClosed(true);
          setAllDrawings((prev) => [...prev, points]);
          setShapeArea(area);
          return;
        }
      }

      setPoints((prev) => [...prev, newPoint]);

      // Always update control points when a new point is added
      const midpoints = calculateMidpoints([...points, newPoint]);
      setControlPoints(midpoints);
    }
  };

  const handleShapeClick = (index, event) => {
    if (!controlsEnabled && !drawingMode) {
      event.stopPropagation();
      setSelectedShapeIndices((prev) => {
        const isSelected = prev.includes(index);
        if (isSelected) {
          return prev.filter((i) => i !== index);
        } else {
          return [...prev, index];
        }
      });
    }
  };

  useEffect(() => {
    if (resetDrawing) {
      setPoints([]);
      setIsShapeClosed(false);
      setSelectedShapeIndices([]);
    }
  }, [resetDrawing]);

  useEffect(() => {
    if (clearAllDesigns) {
      setPoints([]);
      setIsShapeClosed(false);
      setAllDrawings([]);
      setSelectedShapeIndices([]);
    }
  }, [clearAllDesigns]);

  const curveLine =
    points.length > 1 ? (
      <line>
        <primitive object={createCurvedLineGeometry(points)} />
        <lineBasicMaterial color="green" linewidth={2} />
      </line>
    ) : null;

  return (
    <>
      <Plane onClick={handleClick} />
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
      {curveLine}
      {allDrawings.map((drawing, index) => (
        <line
          key={`drawing-${index}`}
          geometry={createCurvedLineGeometry(drawing)}
        >
          <lineBasicMaterial color="green" linewidth={2} />
          {selectedShapeIndices.includes(index) && (
            <lineSegments>
              <edgesGeometry args={[createCurvedLineGeometry(drawing)]} />
              <lineBasicMaterial color="yellow" linewidth={2} />
            </lineSegments>
          )}
        </line>
      ))}
    </>
  );
};

const Plane = ({ onClick }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={onClick}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  );
};

export default SafeZoneDrawing;
