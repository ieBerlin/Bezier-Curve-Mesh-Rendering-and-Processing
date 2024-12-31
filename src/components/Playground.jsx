import React, { useRef, useState, useEffect } from "react";
import SafeZoneDrawing from "./SafeZoneDrawing";
import ModelRenderer from "./ModelRenderer";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import textureImage1 from "../assets/grass.jpg";
import textureImage2 from "../assets/soil.jpg";
import textureImage3 from "../assets/concrete.jpg";

const Plane = ({ onClick, onPointerMove, onPointerUp }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial color="white" side={THREE.DoubleSide} />
    </mesh>
  );
};

const Playground = ({
  controlsEnabled,
  resetDrawing,
  drawingMode,
  selectedTexture,
  clearAllDesigns,
  selectedModel,
}) => {
  const [points, setPoints] = useState([]);
  const [controlPoints, setControlPoints] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);
  const [isShapeClosed, setIsShapeClosed] = useState(false);
  const [allDrawings, setAllDrawings] = useState([]);
  const [allShapes, setAllShapes] = useState([]);
  const { camera } = useThree();
  const texturesRef = useRef({});
  const [selectedShapeIndices, setSelectedShapeIndices] = useState([]);
  const [loadedModels, setLoadedModels] = useState([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const transformRef = useRef();
  const { gl, scene } = useThree();
  const [collisionMaterials, setCollisionMaterials] = useState({});
  const [transformMode, setTransformMode] = useState("translate");
  const [showTransformUI, setShowTransformUI] = useState(false);
  const [showTransformControls, setShowTransformControls] = useState(false);
  const [shapeArea, setShapeArea] = useState(null);
  const [selectedBezierCurves, setSelectedBezierCurves] = useState([]);
  const [bezierCurveTransformMode, setBezierCurveTransformMode] =
    useState("translate");

  // Function to get points along a quadratic curve
  const getQuadraticCurvePoints = (start, control, end, segments = 20) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3();

      // Quadratic Bezier curve formula
      point.x =
        Math.pow(1 - t, 2) * start.x +
        2 * (1 - t) * t * control.x +
        Math.pow(t, 2) * end.x;

      point.z =
        Math.pow(1 - t, 2) * start.z +
        2 * (1 - t) * t * control.z +
        Math.pow(t, 2) * end.z;

      points.push(point);
    }
    return points;
  };

  // Calculate area of curved shape
  const calculateCurvedArea = (vertices, controlPoints) => {
    if (vertices.length < 3 || !controlPoints.length) return 0;

    // Get all curve points
    const allPoints = [];
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length];
      const control = controlPoints[i];

      const curvePoints = getQuadraticCurvePoints(start, control, end);
      allPoints.push(...curvePoints);
    }

    // Calculate area using more detailed points
    let area = 0;
    for (let i = 0; i < allPoints.length; i++) {
      const j = (i + 1) % allPoints.length;
      area += allPoints[i].x * allPoints[j].z;
      area -= allPoints[j].x * allPoints[i].z;
    }

    return Math.abs(area) / 2;
  };

  const createCurvedLineGeometry = (points, controlPoints) => {
    if (points.length < 2) return null;

    const curvePoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const control =
        controlPoints[i] ||
        new THREE.Vector3((start.x + end.x) / 2, 0.02, (start.z + end.z) / 2);

      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      curvePoints.push(...curve.getPoints(20));
    }

    // Add final segment if shape is closed
    if (isShapeClosed) {
      const start = points[points.length - 1];
      const end = points[0];
      const control =
        controlPoints[points.length - 1] ||
        new THREE.Vector3((start.x + end.x) / 2, 0.02, (start.z + end.z) / 2);

      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      curvePoints.push(...curve.getPoints(20));
    }

    return new THREE.BufferGeometry().setFromPoints(curvePoints);
  };

  // Modified handleMouseMove to update area when control points are moved
  const handleMouseMove = (event) => {
    if (drawingMode && isDragging && draggedPointIndex !== null) {
      const [x, y, z] = event.point.toArray();

      setControlPoints((prev) => {
        const newControlPoints = [...prev];
        const prevPoint = points[draggedPointIndex];
        const nextPoint = points[(draggedPointIndex + 1) % points.length];

        const midPoint = new THREE.Vector3(
          (prevPoint.x + nextPoint.x) / 2,
          0.01,
          (prevPoint.z + nextPoint.z) / 2
        );

        const controlPoint = new THREE.Vector3(
          midPoint.x + (x - midPoint.x) * 0.5,
          0.01,
          midPoint.z + (z - midPoint.z) * 0.5
        );

        newControlPoints[draggedPointIndex] = controlPoint;

        // Update area when control points change
        if (isShapeClosed) {
          const newArea = calculateCurvedArea(points, newControlPoints);
          setShapeArea(newArea);
        }

        return newControlPoints;
      });
    }
  };

  const handlePointMouseDown = (index, event) => {
    if (drawingMode) {
      event.stopPropagation();
      setIsDragging(true);
      setDraggedPointIndex(index);
    }
  };

  // Modified handleClick to use curved area calculation
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

  // Area Display component with improved styling
  const AreaDisplay = () => {
    if (!shapeArea && shapeArea !== 0) return null;

    return (
      <Html
        position={[0, 0, 0]}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          backgroundColor: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          fontFamily: "Arial",
          fontSize: "14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        Area: {shapeArea.toFixed(2)} square units
      </Html>
    );
  };

  const calculateMidpoints = (points) => {
    const midpoints = [];
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length];

      const midpoint = new THREE.Vector3(
        (start.x + end.x) / 2,
        0.02, // Slightly raised
        (start.z + end.z) / 2
      );
      midpoints.push(midpoint);
    }
    return midpoints;
  };

  // Modified handleMouseUp to update area after dragging ends
  const handleMouseUp = () => {
    if (isDragging && isShapeClosed) {
      const newArea = calculateCurvedArea(points, controlPoints);
      setShapeArea(newArea);
    }
    setIsDragging(false);
    setDraggedPointIndex(null);
  };

  useEffect(() => {
    // When points are drawn, create initial midpoint control points
    if (points.length > 1 && controlPoints.length === 0) {
      const initialControlPoints = points.map((point, index) => {
        const nextPoint = points[(index + 1) % points.length];
        return new THREE.Vector3(
          (point.x + nextPoint.x) / 2,
          0.01,
          (point.z + nextPoint.z) / 2
        );
      });
      setControlPoints(initialControlPoints);
    }
  }, [points]);

  // Modified handleControlPointMouseDown to update area when dragging control points
  const handleControlPointMouseDown = (index, event) => {
    event.stopPropagation();
    setIsDragging(true);
    setDraggedPointIndex(index);
  };

  const handleControlPointMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
  };

  const renderControlPoints = () => {
    // Only render control points when shape is closed
    if (isShapeClosed && controlPoints.length > 0) {
      return controlPoints.map((controlPoint, index) => (
        <mesh
          key={`control-${index}`}
          position={controlPoint}
          onPointerDown={(event) => handleControlPointMouseDown(index, event)}
          onPointerUp={handleControlPointMouseUp}
        >
          <sphereGeometry args={[0.3, 32, 32]} />{" "}
          {/* Increased from 0.1 to 0.3 */}
          <meshBasicMaterial color="purple" opacity={0.7} transparent={true} />
        </mesh>
      ));
    }
    return null;
  };

  useEffect(() => {
    // Add midpoint control points when the drawing is completed
    if (points.length > 1 && isShapeClosed) {
      const newControlPoints = [];
      for (let i = 0; i < points.length; i++) {
        const currentPoint = points[i];
        const nextPoint = points[(i + 1) % points.length];
        const midpoint = new THREE.Vector3(
          (currentPoint.x + nextPoint.x) / 2,
          0.01,
          (currentPoint.z + nextPoint.z) / 2
        );
        newControlPoints.push(midpoint);
      }
      setControlPoints(newControlPoints);
    }
  }, [points, isShapeClosed]);

  const textures = [
    { name: "Texture 1", src: textureImage1 },
    { name: "Texture 2", src: textureImage2 },
    { name: "Texture 3", src: textureImage3 },
  ];

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    textures.forEach((texture) => {
      loader.load(texture.src, (loadedTexture) => {
        loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        texturesRef.current[texture.name] = loadedTexture;
      });
    });
  }, []);

  useEffect(() => {
    if (
      selectedTexture &&
      selectedShapeIndices.length > 0 &&
      !controlsEnabled
    ) {
      const updatedShapes = selectedShapeIndices.map((index) => {
        const originalDrawing = allDrawings[index];
        // Use stored control points if available, otherwise calculate midpoints
        const shapeControlPoints =
          controlPoints.length > 0
            ? controlPoints
            : calculateMidpoints(originalDrawing);

        return createTexturedShape(
          originalDrawing,
          shapeControlPoints,
          selectedTexture
        );
      });

      setAllShapes((prev) => {
        const newShapes = [...prev];
        selectedShapeIndices.forEach((index, i) => {
          if (updatedShapes[i]) {
            newShapes[index] = updatedShapes[i];
          }
        });
        return newShapes;
      });
    }
  }, [
    selectedTexture,
    selectedShapeIndices,
    controlsEnabled,
    allDrawings,
    controlPoints,
  ]);

  const handleShapeClick = (index, event) => {
    if (!controlsEnabled && !drawingMode) {
      // Disable shape selection while drawing
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

  const createTexturedShape = (points, controlPoints, textureName) => {
    if (points.length > 2 && texturesRef.current[textureName]) {
      // Create curved shape points
      const curvePoints = [];
      for (let i = 0; i < points.length; i++) {
        const start = points[i];
        const end = points[(i + 1) % points.length];

        // Use provided control point or calculate a default midpoint
        const control =
          (controlPoints && controlPoints[i]) ||
          new THREE.Vector3((start.x + end.x) / 2, 0.02, (start.z + end.z) / 2);

        const curve = new THREE.QuadraticBezierCurve3(start, control, end);
        curvePoints.push(...curve.getPoints(20));
      }

      // Create shape from curved points
      const shape = new THREE.Shape();
      shape.moveTo(curvePoints[0].x, curvePoints[0].z);
      for (let i = 1; i < curvePoints.length; i++) {
        shape.lineTo(curvePoints[i].x, curvePoints[i].z);
      }

      const geometry = new THREE.ShapeGeometry(shape);

      // Calculate UVs based on bounding box
      const bbox = new THREE.Box3().setFromPoints(curvePoints);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const uvs = curvePoints.map((point) => [
        (point.x - bbox.min.x) / size.x,
        1 - (point.z - bbox.min.z) / size.z,
      ]);

      geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(uvs.flat(), 2)
      );

      const material = new THREE.MeshBasicMaterial({
        map: texturesRef.current[textureName],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });

      return {
        geometry,
        material,
        originalPoints: points, // Store original points
        originalControlPoints: controlPoints || calculateMidpoints(points), // Store original control points
      };
    }
    return null;
  };

  // Modify the texture application effect
  useEffect(() => {
    if (
      selectedTexture &&
      selectedShapeIndices.length > 0 &&
      !controlsEnabled
    ) {
      const updatedShapes = selectedShapeIndices.map((index) => {
        const existingShape = allShapes[index];

        // Use stored original points and control points if available
        const originalPoints =
          existingShape.originalPoints || allDrawings[index];
        const originalControlPoints =
          existingShape.originalControlPoints ||
          calculateMidpoints(originalPoints);

        return createTexturedShape(
          originalPoints,
          originalControlPoints,
          selectedTexture
        );
      });

      setAllShapes((prev) => {
        const newShapes = [...prev];
        selectedShapeIndices.forEach((index, i) => {
          if (updatedShapes[i]) {
            newShapes[index] = updatedShapes[i];
          }
        });
        return newShapes;
      });
    }
  }, [selectedTexture, selectedShapeIndices, controlsEnabled, allDrawings]);

  useEffect(() => {
    if (isShapeClosed && selectedTexture && controlPoints.length > 0) {
      const newShape = createTexturedShape(
        points,
        controlPoints,
        selectedTexture
      );
      if (newShape) {
        setAllShapes((prev) => [...prev, newShape]);
        setPoints([]);
        setControlPoints([]);
        setIsShapeClosed(false);
      }
    }
  }, [isShapeClosed, selectedTexture, controlPoints]);

  useEffect(() => {
    if (resetDrawing) {
      setPoints([]);
      setIsShapeClosed(false);
      setSelectedShapeIndices([]);
      setShapeArea(null);
    }
  }, [resetDrawing]);

  useEffect(() => {
    if (clearAllDesigns) {
      setPoints([]);
      setIsShapeClosed(false);
      setAllDrawings([]);
      setAllShapes([]);
      setSelectedShapeIndices([]);
      setShapeArea(null);
    }
  }, [clearAllDesigns]);

  const curveLine =
    points.length > 1 ? (
      <line>
        <primitive object={createCurvedLineGeometry(points, controlPoints)} />
        <lineBasicMaterial color="blue" linewidth={2} />
      </line>
    ) : null;

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Plane
        onClick={handleClick}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
      />
      {points.map((point, index) => (
        <mesh
          key={index}
          position={point}
          onPointerDown={(event) => handlePointMouseDown(index, event)}
          onPointerUp={handleMouseUp}
        >
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
      {curveLine}
      {renderControlPoints()}
      {allShapes.map((shape, index) => (
        <mesh
          key={`shape-${index}`}
          geometry={shape.geometry}
          material={shape.material}
          position={[0, 0.01 + index * 0.001, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(event) => handleShapeClick(index, event)}
        >
          {selectedShapeIndices.includes(index) && (
            <lineSegments>
              <edgesGeometry args={[shape.geometry]} />
              <lineBasicMaterial color="yellow" linewidth={2} />
            </lineSegments>
          )}
        </mesh>
      ))}
      <ModelRenderer
        selectedModel={selectedModel}
        loadedModels={loadedModels}
        selectedModelIndex={selectedModelIndex}
        setSelectedModelIndex={setSelectedModelIndex}
        showTransformControls={showTransformControls}
        setShowTransformControls={setShowTransformControls}
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        showTransformUI={true}
        setShowTransformUI={setShowTransformUI}
        selectedBezierCurves={selectedBezierCurves}
        setSelectedBezierCurves={setSelectedBezierCurves}
        bezierCurveTransformMode={bezierCurveTransformMode}
        setBezierCurveTransformMode={setBezierCurveTransformMode}
        camera={camera}
        gl={gl}
      />
      <AreaDisplay />
    </>
  );
};

export default Playground;
