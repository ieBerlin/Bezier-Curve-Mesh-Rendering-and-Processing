export function refineVertexResolution(vertices, resolution = 3) {
  if (resolution < 1) throw new Error("Resolution must be at least 1.");

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

export function retrieveComponents(vertices) {
  const components = [];
  const explored = new Set();

  function areClustersEquivalent(cluster1, cluster2, tolerance = 0.01) {
    if (cluster1.length !== cluster2.length) return false;
    const sortedCluster1 = cluster1.slice().sort((a, b) => a.x - b.x);
    const sortedCluster2 = cluster2.slice().sort((a, b) => a.x - b.x);

    return sortedCluster1.every((point, index) => {
      const dx = Math.abs(point.x - sortedCluster2[index].x);
      const dz = Math.abs(point.z - sortedCluster2[index].z);
      return dx < tolerance && dz < tolerance;
    });
  }

  function groupPointsDBSCAN(points, epsilon = 0.15, minPoints = 3) {
    const groups = [];
    const outliers = [];
    const exploredPoints = new Set();

    function neighborhoodQuery(point) {
      return points.filter(
        (v) => Math.hypot(v.x - point.x, v.z - point.z) <= epsilon
      );
    }

    function expandGroup(point, neighbors, group) {
      group.push(point);
      exploredPoints.add(point);

      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (!exploredPoints.has(neighbor)) {
          exploredPoints.add(neighbor);
          const newNeighbors = neighborhoodQuery(neighbor);
          if (newNeighbors.length >= minPoints) {
            neighbors = neighbors.concat(newNeighbors);
          }
        }
        if (!groups.some((g) => g.includes(neighbor))) {
          group.push(neighbor);
        }
      }
    }

    points.forEach((vertex) => {
      if (exploredPoints.has(vertex)) return;
      const neighbors = neighborhoodQuery(vertex);
      if (neighbors.length < minPoints) {
        outliers.push(vertex);
      } else {
        const group = [];
        expandGroup(vertex, neighbors, group);
        groups.push(group);
      }
    });

    return groups;
  }

  const groups = groupPointsDBSCAN(vertices);

  groups.forEach((group, i) => {
    if (explored.has(i)) return;
    const currentComponent = [group];

    for (let j = i + 1; j < groups.length; j++) {
      if (!explored.has(j) && areClustersEquivalent(group, groups[j])) {
        currentComponent.push(groups[j]);
        explored.add(j);
      }
    }

    components.push(currentComponent);
    explored.add(i);
  });

  return components.map((component, index) => ({
    partId: index + 1,
    clusters: component.flat(),
  }));
}
