/* eslint-disable react/display-name */
import React, { useState, useEffect, useRef, useMemo, useFra } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "/node_modules/three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "/node_modules/three/examples/jsm/loaders/DRACOLoader";
import BezierCurveRenderer from "./BezierCurveRenderer";

const ModelRenderer = ({
  selectedModel,
  onModelLoad,
  showTransformUI,
  onTransformUIChange,
}) => {
  const [loadedModels, setLoadedModels] = useState([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [transformMode, setTransformMode] = useState("translate");
  const [selectedBezierCurves, setSelectedBezierCurves] = useState([]);
  const [bezierCurveTransformMode, setBezierCurveTransformMode] =
    useState("translate");
  const { camera, gl } = useThree();
  const transformRef = useRef();

  const fitModelToSize = (model, targetSize = 5) => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDimension;
    model.scale.multiplyScalar(scale);
    return scale;
  };

  useEffect(() => {
    if (selectedModel) {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.4.3/"
      );
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        selectedModel.url,
        (gltf) => {
          const model = gltf.scene;

          // Prepare materials and track BézierCurve meshes
          const bezierCurveMeshes = [];
          model.traverse((child) => {
            if (child.isMesh) {
              // Create unique materials
              if (Array.isArray(child.material)) {
                child.material = child.material.map((mat) => {
                  const newMat = mat.clone();
                  newMat.needsUpdate = true;
                  return newMat;
                });
              } else if (child.material) {
                child.material = child.material.clone();
                child.material.needsUpdate = true;
              }

              // Store original colors
              if (Array.isArray(child.material)) {
                child.userData.originalColors = child.material.map((mat) =>
                  mat.color ? mat.color.clone() : new THREE.Color(0xffffff)
                );
              } else if (child.material) {
                child.userData.originalColor = child.material.color
                  ? child.material.color.clone()
                  : new THREE.Color(0xffffff);
              }

              // Identify BézierCurve meshes
              if (child.name === "BézierCurve") {
                bezierCurveMeshes.push(child);
                child.userData.isBezierCurve = true;
              }
            }
          });

          const scale = fitModelToSize(model);
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());

          model.position.set(-center.x, -box.min.y, -center.z);

          setLoadedModels((prev) => [
            ...prev,
            {
              model,
              position: new THREE.Vector3(-center.x, -box.min.y, -center.z),
              scale,
              bezierCurveMeshes,
            },
          ]);

          // Callback to parent component
        },
        undefined,
        (error) => {
          console.error("An error occurred while loading the model", error);
        }
      );
    }
  }, [selectedModel]);

  // Collision detection method
  const detectCollision = (model1, model2) => {
    const box1 = new THREE.Box3().setFromObject(model1);
    const box2 = new THREE.Box3().setFromObject(model2);
    return box1.intersectsBox(box2);
  };

  useFrame(() => {
    // Collision detection for all models
    let isAnyCollision = false;

    if (loadedModels.length >= 2) {
      // Check collisions between all pairs of models
      for (let i = 0; i < loadedModels.length; i++) {
        for (let j = i + 1; j < loadedModels.length; j++) {
          const model1 = loadedModels[i].model;
          const model2 = loadedModels[j].model;

          // Check for collision between the two models
          const collision = detectCollision(model1, model2);

          if (collision) {
            isAnyCollision = true;

            // Apply red color to BézierCurve meshes in both models
            model1.traverse((child) => {
              if (child.name === "BézierCurve") {
                if (Array.isArray(child.material)) {
                  child.material = child.material.map(
                    () => new THREE.MeshBasicMaterial({ color: 0xff0000 })
                  );
                } else {
                  child.material = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                  });
                }
                child.material.needsUpdate = true;
              }
            });

            model2.traverse((child) => {
              if (child.name === "BézierCurve") {
                if (Array.isArray(child.material)) {
                  child.material = child.material.map(
                    () => new THREE.MeshBasicMaterial({ color: 0xff0000 })
                  );
                } else {
                  child.material = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                  });
                }
                child.material.needsUpdate = true;
              }
            });
          }
        }
      }

      // If no collision detected, turn BézierCurve meshes green
      if (!isAnyCollision) {
        loadedModels.forEach(({ model }) => {
          model.traverse((child) => {
            if (child.name === "BézierCurve") {
              if (Array.isArray(child.material)) {
                child.material = child.material.map(
                  () => new THREE.MeshBasicMaterial({ color: 0x00ff00 })
                );
              } else {
                child.material = new THREE.MeshBasicMaterial({
                  color: 0x00ff00,
                });
              }
              child.material.needsUpdate = true;
            }
          });
        });
      }
    }
  });

  // Handle model click and selection
  const handleModelClick = (index, event) => {
    event.stopPropagation();
    setSelectedModelIndex(index);
  };

  // Handle model movement
  const handleModelMove = (event) => {
    if (selectedModelIndex !== null) {
      const { x, y, z } = event.target.worldPosition;
      setLoadedModels((prev) => {
        const newModels = [...prev];
        newModels[selectedModelIndex].position.set(x, y, z);
        return newModels;
      });
    }
  };

  // Handle transform mode change
  const handleTransformModeChange = (mode) => {
    setTransformMode(mode);
  };

  // Handle model deletion
  const handleDeleteModel = () => {
    if (selectedModelIndex !== null) {
      setLoadedModels((prev) =>
        prev.filter((_, index) => index !== selectedModelIndex)
      );
      setSelectedModelIndex(null);
      onTransformUIChange({
        showTransformUI: false,
        showTransformControls: false,
      });
    }
  };

  // BézierCurve mesh handling
  const handleBezierCurveClick = (modelIndex, bezierCurveMesh, event) => {
    event.stopPropagation();

    setSelectedBezierCurves((prev) => {
      const isSelected = prev.some(
        (item) =>
          item.modelIndex === modelIndex &&
          item.bezierCurveMesh === bezierCurveMesh
      );

      if (isSelected) {
        // Deselect
        return prev.filter(
          (item) =>
            item.modelIndex !== modelIndex ||
            item.bezierCurveMesh !== bezierCurveMesh
        );
      } else {
        // Select
        return [...prev, { modelIndex, bezierCurveMesh }];
      }
    });
  };

  // Delete selected BézierCurve meshes
  const handleDeleteBezierCurve = () => {
    setLoadedModels((prev) => {
      const newModels = [...prev];

      selectedBezierCurves.forEach(({ modelIndex, bezierCurveMesh }) => {
        const modelData = newModels[modelIndex];

        // Remove the mesh from the model
        modelData.model.remove(bezierCurveMesh);

        // Remove from bezierCurveMeshes array
        modelData.bezierCurveMeshes = modelData.bezierCurveMeshes.filter(
          (mesh) => mesh !== bezierCurveMesh
        );
      });

      return newModels;
    });

    // Clear selection
    setSelectedBezierCurves([]);
  };

  // BézierCurve side change handler
  const handleBezierCurveSideChange = (side) => {
    setLoadedModels((prev) => {
      const newModels = [...prev];

      selectedBezierCurves.forEach(({ modelIndex, bezierCurveMesh }) => {
        const sideMappings = {
          FrontSide: THREE.FrontSide,
          BackSide: THREE.BackSide,
          DoubleSide: THREE.DoubleSide,
        };

        if (Array.isArray(bezierCurveMesh.material)) {
          bezierCurveMesh.material.forEach((mat) => {
            mat.side = sideMappings[side];
            mat.needsUpdate = true;
          });
        } else {
          bezierCurveMesh.material.side = sideMappings[side];
          bezierCurveMesh.material.needsUpdate = true;
        }
      });

      return newModels;
    });
  };

  // Transform UI for models
  const TransformUI = useMemo(() => {
    return () => (
      <Html
        position={[0, 0, 0]}
        style={{
          position: "absolute",
          top: "-330px",
          right: "650px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.8)",
            padding: "10px",
            borderRadius: "5px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => handleTransformModeChange("translate")}
            style={{ color: "black" }}
          >
            Move
          </button>
          <button
            onClick={() => handleTransformModeChange("rotate")}
            style={{ color: "black" }}
          >
            Rotate
          </button>
          <button
            onClick={() => handleTransformModeChange("scale")}
            style={{ color: "black" }}
          >
            Scale
          </button>
          <button onClick={handleDeleteModel} style={{ color: "red" }}>
            Delete
          </button>
        </div>
      </Html>
    );
  }, [handleTransformModeChange, handleDeleteModel]);

  // BézierCurve Transform UI
  const BezierCurveTransformUI = useMemo(() => {
    return () => (
      <Html
        position={[0, 0, 0]}
        style={{
          position: "absolute",
          top: "-150px",
          right: "615px",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.8)",
            padding: "10px",
            borderRadius: "5px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <button
            onClick={() => setBezierCurveTransformMode("translate")}
            style={{ color: "black" }}
          >
            Move
          </button>
          <button
            onClick={() => setBezierCurveTransformMode("rotate")}
            style={{ color: "black" }}
          >
            Rotate
          </button>
          <button
            onClick={() => setBezierCurveTransformMode("scale")}
            style={{ color: "black" }}
          >
            Scale
          </button>
          <button onClick={handleDeleteBezierCurve} style={{ color: "red" }}>
            Delete
          </button>
        </div>
      </Html>
    );
  }, [
    setBezierCurveTransformMode,
    handleDeleteBezierCurve,
    handleBezierCurveSideChange,
  ]);

  return (
    <>
      {loadedModels.map((modelData, modelIndex) => (
        <group key={`model-${modelIndex}`}>
          <primitive
            object={modelData.model}
            position={modelData.position}
            scale={[modelData.scale, modelData.scale, modelData.scale]}
            onClick={(event) => handleModelClick(modelIndex, event)}
          >
            {/* Render BézierCurve meshes with selection highlight */}
            {modelData.bezierCurveMeshes.map((bezierCurveMesh, curveIndex) => (
              <BezierCurveRenderer
                bezierCurveMesh={bezierCurveMesh}
                curveIndex={curveIndex}
                modelIndex={modelIndex}
                selectedBezierCurves={selectedBezierCurves}
                handleBezierCurveClick={handleBezierCurveClick}
              />
            ))}
          </primitive>

          {/* Transform controls for selected model and BézierCurve meshes */}
          {selectedModelIndex === modelIndex && (
            <TransformControls
              ref={transformRef}
              object={modelData.model}
              mode={transformMode}
              size={0.5}
              showX={true}
              showY={true}
              camera={camera}
              gl={gl}
              onObjectChange={handleModelMove}
            />
          )}

          {selectedBezierCurves.length > 0 && (
            <TransformControls
              ref={transformRef}
              object={selectedBezierCurves[0].bezierCurveMesh}
              mode={bezierCurveTransformMode}
              size={0.5}
              showX={true}
              showY={true}
              camera={camera}
              gl={gl}
            />
          )}
        </group>
      ))}

      {/* Show Transform UI when appropriate */}
      {selectedBezierCurves.length > 0 && <BezierCurveTransformUI />}
      {showTransformUI && <TransformUI />}
    </>
  );
};

export default ModelRenderer;
