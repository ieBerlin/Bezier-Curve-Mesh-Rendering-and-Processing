import * as THREE from "three";
export function generateVertexSpheres(vertices) {
  const vertexSpheres = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const vertex = new THREE.Vector3(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    );
    vertexSpheres.push(vertex);
  }
  return vertexSpheres;
}
