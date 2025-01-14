export function retrieveComponents(
  vertices,
  {
    epsilon: defaultEpsilon = 0.15,
    minPoints: defaultMinPoints = 3,
    tolerance: defaultTolerance = 0.01,
  }
) {
  const components = [];
  const explored = new Set();

  // Enhanced DBSCAN clustering
  function groupPointsDBSCAN(
    points,
    epsilon = defaultEpsilon,
    minPoints = defaultMinPoints
  ) {
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

  // Function to get the convex hull of a set of points
  function getConvexHull(points) {
    points = points.slice().sort((a, b) => a.x - b.x || a.z - b.z);

    const lower = [];
    for (const point of points) {
      while (
        lower.length >= 2 &&
        crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <=
          0
      ) {
        lower.pop();
      }
      lower.push(point);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      while (
        upper.length >= 2 &&
        crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <=
          0
      ) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  // Cross product of two vectors
  function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  }

  // Enhanced shape comparison using convex hulls and shape area
  function areClustersEquivalent(
    cluster1,
    cluster2,
    tolerance = defaultTolerance
  ) {
    if (cluster1.length !== cluster2.length) return false;

    const hull1 = getConvexHull(cluster1);
    const hull2 = getConvexHull(cluster2);

    if (!arePolygonsSimilar(hull1, hull2, tolerance)) return false;

    // Optionally, check for other properties like area, centroid, or bounding box similarity
    const area1 = calculateArea(hull1);
    const area2 = calculateArea(hull2);

    return Math.abs(area1 - area2) <= tolerance;
  }

  // Function to calculate the area of a polygon using the shoelace formula
  function calculateArea(hull) {
    let area = 0;
    for (let i = 0; i < hull.length; i++) {
      const j = (i + 1) % hull.length;
      area += hull[i].x * hull[j].z - hull[j].x * hull[i].z;
    }
    return Math.abs(area) / 2;
  }

  // Function to check if two polygons (hulls) are similar
  function arePolygonsSimilar(hull1, hull2, tolerance) {
    if (hull1.length !== hull2.length) return false;

    for (let i = 0; i < hull1.length; i++) {
      let match = true;
      for (let j = 0; j < hull1.length; j++) {
        const dx = Math.abs(hull1[(i + j) % hull1.length].x - hull2[j].x);
        const dz = Math.abs(hull1[(i + j) % hull1.length].z - hull2[j].z);
        if (dx > tolerance || dz > tolerance) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  // Function to find the starting point (the leftmost point)
  function findStartingPoint(cluster) {
    return cluster.reduce(
      (leftmost, point) => (point.x < leftmost.x ? point : leftmost),
      cluster[0]
    );
  }

  // Group the points using DBSCAN
  const groups = groupPointsDBSCAN(vertices);

  // Iterate over the groups and combine similar clusters
  groups.forEach((group, i) => {
    if (explored.has(i)) return;

    const startingPoint = findStartingPoint(group);
    const currentComponent = [group];

    for (let j = i + 1; j < groups.length; j++) {
      if (!explored.has(j) && areClustersEquivalent(group, groups[j])) {
        currentComponent.push(groups[j]);
        explored.add(j);
      }
    }

    components.push({
      partId: i + 1,
      startingPoint,
      clusters: currentComponent.flat(),
    });
    explored.add(i);
  });

  return components;
}
