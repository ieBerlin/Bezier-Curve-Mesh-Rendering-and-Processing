import * as THREE from "three";
import { refineVertexResolution } from "../assets/Utils/refineVertexResolution";
import { combineLineAndShape } from "../MeshProcessing/combineLineAndShape";
import { retrieveComponents } from "../assets/Utils/retrieveComponents";
import { mergeClusters } from "../MeshProcessing/mergeClusters";
import { generateVertexSpheres } from "./../MeshProcessing/generateVertexSpheres";
import GroupedShapes from "./GroupedShapes";
import FirstShapeRenderer from "./GroupedShapes";

function BezierCurveRenderer({
  modelIndex,
  curveIndex,
  bezierCurveMesh,
  selectedBezierCurves,
  handleBezierCurveClick,
}) {
  const isSelected = selectedBezierCurves.some(
    (item) =>
      item.modelIndex === modelIndex && item.bezierCurveMesh === bezierCurveMesh
  );

  const geometry = bezierCurveMesh.geometry;
  const vertices = geometry.attributes.position.array;
  const vertexSpheres = generateVertexSpheres(vertices);

  const highResVertices = refineVertexResolution(vertexSpheres);
  const meshItems = retrieveComponents(highResVertices);
  const mergedClusters = mergeClusters(meshItems);
  const shapes = mergedClusters?.filter((shape) => shape.partId != "_line");
  // const firstCluster =
  //   mergedClusters[0]?.clusters.map((item) => {
  //     return new THREE.Vector3(item.x, item.y || 0, item.z);
  //   }) || [];

  return (
    <primitive
      key={`bezier-curve-${modelIndex}-${curveIndex}`}
      object={bezierCurveMesh}
      // onClick={(event) =>
      //   handleBezierCurveClick(modelIndex, bezierCurveMesh, event)
      // }
    >
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="yellow" linewidth={2} />
        </lineSegments>
      )}

      {/* Render the first shape using the new component */}
      {shapes?.map((item, index) => (
        <FirstShapeRenderer KEY={item.partId + index} shape={item} />
      ))}
    </primitive>
  );
}
export default BezierCurveRenderer;
