import { retrieveComponents } from "./../assets/Utils/retrieveComponents";
export function segmentMesh(vertices) {
  let processedVertices = [];
  vertices.forEach((element) =>
    processedVertices.push({ x: element.x, z: element.z })
  );

  return retrieveComponents(vertices);
}
