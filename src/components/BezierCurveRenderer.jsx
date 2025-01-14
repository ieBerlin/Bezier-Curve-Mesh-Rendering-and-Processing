import { refineVertexResolution } from "../assets/Utils/refineVertexResolution";
import { retrieveComponents } from "../assets/Utils/retrieveComponents";
import { mergeClusters } from "../MeshProcessing/mergeClusters";
import { generateVertexSpheres } from "./../MeshProcessing/generateVertexSpheres";
import InteractiveShapeScaler from "./InteractiveShapeScaler";
import { useState, useEffect } from "react";

function BezierCurveRenderer({
  settings,
  onToggleMeshOptionsVisibility,
  modelIndex,
  curveIndex,
  bezierCurveMesh,
  selectedBezierCurves,
  handleBezierCurveClick,
}) {
  useEffect(() => {
    onToggleMeshOptionsVisibility(true);
  }, [onToggleMeshOptionsVisibility]);
  const isSelected = selectedBezierCurves.some(
    (item) =>
      item.modelIndex === modelIndex && item.bezierCurveMesh === bezierCurveMesh
  );

  const geometry = bezierCurveMesh.geometry;
  const vertices = geometry.attributes.position.array;
  const vertexSpheres = generateVertexSpheres(vertices);

  const highResVertices = refineVertexResolution(
    vertexSpheres,
    settings.minSpacing
  );
  const meshItems = retrieveComponents(highResVertices, settings);
  const mergedClusters = mergeClusters(meshItems);
  const shapes = mergedClusters?.filter((shape) => shape.partId != "_line");

  return (
    <>
      <primitive
        key={`bezier-curve-${modelIndex}-${curveIndex}`}
        object={bezierCurveMesh}
      >
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[geometry]} />
            <lineBasicMaterial color="yellow" linewidth={2} />
          </lineSegments>
        )}

        {/* Render the first shape using the new component */}
        {shapes?.map((item, index) => (
          <InteractiveShapeScaler KEY={item.partId + index} shape={item} />
        ))}
      </primitive>
    </>
  );
}
export default BezierCurveRenderer;
