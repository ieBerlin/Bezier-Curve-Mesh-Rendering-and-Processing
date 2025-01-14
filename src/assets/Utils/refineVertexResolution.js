export function refineVertexResolution(vertices, minSpacing = 0.6, resolution = 1) {
  if (minSpacing <= 0) throw new Error("Minimum spacing must be greater than 0.");
  if (resolution <= 0) throw new Error("Resolution must be greater than 0.");

  const refinedVertices = [];

  function addMidpoints(p0, p1) {
    const distance = p0.distanceTo(p1);

    if (distance > minSpacing) {
      const midpoint = p0.clone().lerp(p1, 0.4);
      addMidpoints(p0, midpoint);
      refinedVertices.push(midpoint);
      addMidpoints(midpoint, p1);
    } else {
      refinedVertices.push(p1);
    }
  }

  for (let i = 0; i < vertices.length - 1; i++) {
    const p0 = vertices[i];
    const p1 = vertices[i + 1];

    for (let j = 0; j <= resolution; j++) {
      const t = j / resolution;
      const interpolatedVertex = p0.clone().lerp(p1, t);
      refinedVertices.push(interpolatedVertex);
    }

    addMidpoints(p0, p1);
  }

  return refinedVertices;
}
