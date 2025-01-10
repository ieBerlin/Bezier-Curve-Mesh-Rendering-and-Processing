export function refineVertexResolution(vertices, resolution = 2) {
  const refinedVertices = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    const p0 = vertices[i];
    const p1 = vertices[i + 1];

    for (let j = 0; j <= resolution; j++) {
      const t = j / resolution;
      const interpolatedVertex = p0.clone().lerp(p1, t);
      refinedVertices.push(interpolatedVertex);
    }
  }
  return refinedVertices;
}
