import React, { useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ModelSelectionDialog from "./ModelSelectionDialog";
import top2 from "../assets/top2.jpeg";
import ground from "../assets/ground.jpeg";
import cloud from "../assets/cloud.jpeg";
import slideModelUrl from "../assets/models/slide.glb?url";
import slide2ModelUrl from "../assets/models/slide2.glb?url";
import slide3ModelUrl from "../assets/models/slide3.glb?url";
import slide4ModelUrl from "../assets/models/slide4.glb?url";
import swingModelUrl from "../assets/models/swing.glb?url";
import houseModelUrl from "../assets/models/house.glb?url";
import slideThumbnail from "../assets/thumbnail/slideThumbnail.png";
import slide2Thumbnail from "../assets/thumbnail/slide2Thumbnail.png";
import slide3Thumbnail from "../assets/thumbnail/slide3Thumbnail.png";
import slide4Thumbnail from "../assets/thumbnail/slide4Thumbnail.png";
import swingThumbnail from "../assets/thumbnail/swingThumbnail.png";
import houseThumbnail from "../assets/thumbnail/houseThumbnail.png";
import Playground from "./Playground";
import SafeZoneDrawing from "./SafeZoneDrawing"; // Import the new SafeZoneDrawing component

const Grid = () => {
  return <gridHelper args={[30, 30]} />;
};

const Axes = () => {
  return <axesHelper args={[5]} />;
};

const Controls = ({ controlsEnabled }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsEnabled) {
      camera.position.set(5, 19, 0); // Top view
      camera.lookAt(0, 0, 0); // Look at center
    } else {
      camera.position.set(0, 2, 5); // Default position
      camera.lookAt(0, 0, 0); // Look at center
    }
  }, [controlsEnabled, camera]);

  return controlsEnabled ? <OrbitControls /> : null;
};

const CubeTextureLoader = () => {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x000000); // Set default background color for testing

    const loader = new THREE.CubeTextureLoader();

    const texture = loader.load(
      [top2, top2, cloud, ground, top2, top2],
      () => {
        texture.generateMipmaps = false; // Disable mipmap generation for non-power-of-two images
        scene.background = texture;
      },
      undefined,
      (error) => {
        console.error(
          "An error occurred while loading the cube texture",
          error
        );
      }
    );

    return () => {
      scene.background = null; // Reset the background
    };
  }, [scene]);

  return null;
};

const ThreeDCanvas = () => {
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const [resetDrawing, setResetDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  const [clearAllDesigns, setClearAllDesigns] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const models = [
    { name: "Slide", thumbnail: slideThumbnail, url: slideModelUrl },
    { name: "Slide2", thumbnail: slide2Thumbnail, url: slide2ModelUrl },
    { name: "Slide3", thumbnail: slide3Thumbnail, url: slide3ModelUrl },
    { name: "Slide4", thumbnail: slide4Thumbnail, url: slide4ModelUrl },
    { name: "Swing", thumbnail: swingThumbnail, url: swingModelUrl },
    { name: "House", thumbnail: houseThumbnail, url: houseModelUrl },
  ];

  const handleOpenModelDialog = () => {
    setIsModelDialogOpen(true);
  };

  const handleCloseModelDialog = () => {
    setIsModelDialogOpen(false);
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    setIsModelDialogOpen(false);
  };

  const handleToggleControls = () => {
    setControlsEnabled((prev) => !prev);
  };

  const handleResetDrawing = () => {
    setResetDrawing((prev) => !prev);
  };

  const handleToggleDrawingMode = () => {
    // Toggle between null and 'design' mode when no specific mode is passed
    setDrawingMode((prevMode) => {
      if (prevMode === null) return "design";
      return null;
    });
  };

  const handleSpecificDrawingModeToggle = (mode) => {
    // Toggle specific drawing modes (design or safeZone)
    setDrawingMode((prevMode) => {
      if (prevMode === mode) return null;
      return mode;
    });
  };

  const handleTextureChange = (event) => {
    if (!controlsEnabled) {
      setSelectedTexture(event.target.value);
    } else {
      alert("Please disable Orbit Controls to change texture.");
    }
  };

  const handleClearAllDesigns = () => {
    setClearAllDesigns(true);
    setTimeout(() => setClearAllDesigns(false), 100); // Reset the state after a short delay
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          zIndex: 10,
        }}
      >
        {/* <button
          className={`bg-white text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100 hover:text-blue-500 ${drawingMode === 'safeZone' ? 'bg-blue-100 text-blue-500' : ''}`}
          onClick={() => handleSpecificDrawingModeToggle('safeZone')}
        >
          {drawingMode === 'safeZone' ? "Stop Safe Zone Drawing" : "Start Safe Zone Drawing"}
        </button> */}
        <button
          className="bg-white  text-gray-500 border font-bold border-blue-500 p-2 rounded-md hover:bg-blue-100 hover:text-blue-500"
          onClick={handleToggleControls}
        >
          {controlsEnabled ? "Disable" : "Enable"} 3D Controls
        </button>
        <button
          className="bg-white  text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100 hover:text-blue-500"
          onClick={handleResetDrawing}
        >
          {resetDrawing ? "Start New Design" : "Close Current Design"}
        </button>
        <button
          className="bg-white  text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100 hover:text-blue-500"
          onClick={handleToggleDrawingMode}
        >
          {drawingMode ? "Stop Drawing" : "Start Drawing"}
        </button>
        <select
          onChange={handleTextureChange}
          className="bg-white  text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100 hover:text-blue-500"
          disabled={controlsEnabled}
        >
          <option value="">Select Texture</option>
          <option value="Texture 1">Grass</option>
          <option value="Texture 2">Soil</option>
          <option value="Texture 3">Concrete</option>
        </select>
        <button
          className="bg-white  text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100  hover:text-blue-500"
          onClick={handleClearAllDesigns}
        >
          Clear All Designs
        </button>
        <button
          className="bg-white text-gray-500 border border-blue-500 font-bold p-2 rounded-md hover:bg-blue-100 hover:text-blue-500"
          onClick={handleOpenModelDialog}
        >
          Add 3D Model
        </button>
      </div>
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <Controls controlsEnabled={controlsEnabled} />
        {/* <CubeTextureLoader /> */}
        <Axes />
        <Grid />
        <Playground
          controlsEnabled={controlsEnabled}
          resetDrawing={resetDrawing}
          drawingMode={drawingMode}
          selectedTexture={selectedTexture}
          clearAllDesigns={clearAllDesigns}
          selectedModel={selectedModel}
        />
        {drawingMode === "safeZone" && (
          <SafeZoneDrawing
            controlsEnabled={controlsEnabled}
            resetDrawing={resetDrawing}
            drawingMode={drawingMode === "safeZone"}
            clearAllDesigns={clearAllDesigns}
          />
        )}
      </Canvas>
      <ModelSelectionDialog
        isOpen={isModelDialogOpen}
        onClose={handleCloseModelDialog}
        onSelectModel={handleSelectModel}
        models={models}
      />
    </>
  );
};

export default ThreeDCanvas;
