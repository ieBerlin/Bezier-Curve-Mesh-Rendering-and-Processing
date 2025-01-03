import * as THREE from "three";
import { refineVertexResolution } from "../assets/Utils/refineVertexResolution";
import { combineLineAndShape } from "../MeshProcessing/combineLineAndShape";
import { retrieveComponents } from "../assets/Utils/retrieveComponents";
import { mergeClusters } from "../MeshProcessing/mergeClusters";
import { generateVertexSpheres } from "./../MeshProcessing/generateVertexSpheres";

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
  const combinedItems = combineLineAndShape(meshItems);

  const firstCluster =
    meshItems[4]?.clusters.map((item) => {
      return new THREE.Vector3(item.x, item.y || 0, item.z);
    }) || [];

  console.log(mergedClusters);

  return (
    <primitive
      key={`bezier-curve-${modelIndex}-${curveIndex}`}
      object={bezierCurveMesh}
      onClick={(event) =>
        handleBezierCurveClick(modelIndex, bezierCurveMesh, event)
      }
    >
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="yellow" linewidth={2} />
        </lineSegments>
      )}

      {firstCluster.map((vertex, index) => (
        <mesh key={index} position={vertex}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}

      <mesh>
        <meshBasicMaterial color="blue" side={THREE.DoubleSide} />
      </mesh>
    </primitive>
  );
}
export default BezierCurveRenderer;
