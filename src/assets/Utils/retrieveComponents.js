export function retrieveComponents(vertices) {
  const components = [];
  const explored = new Set();

  // Optimized areClustersEquivalent function that handles complex shapes
  function areClustersEquivalent(cluster1, cluster2, tolerance = 0.01) {
    if (cluster1.length !== cluster2.length) return false;

    // Perform convex hulls-based comparison for complex shapes
    const hull1 = getConvexHull(cluster1);
    const hull2 = getConvexHull(cluster2);

    // Compare the convex hulls
    if (!arePolygonsSimilar(hull1, hull2, tolerance)) return false;

    return true;
  }

  // Function to get the convex hull of a set of points
  function getConvexHull(points) {
    // Sort points lexicographically (by x, then by y)
    points = points.slice().sort((a, b) => a.x - b.x || a.z - b.z);

    // Build the lower hull
    const lower = [];
    for (const point of points) {
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    }

    // Build the upper hull
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }

    // Remove the last point of each half because it's repeated at the beginning of the other half
    lower.pop();
    upper.pop();

    return lower.concat(upper); // Combine lower and upper hull to get the convex hull
  }

  // Cross product of two vectors
  function crossProduct(o, a, b) {
    return (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  }

  // Function to check if two polygons (hulls) are similar
  function arePolygonsSimilar(hull1, hull2, tolerance) {
    // Check if they have similar vertices, considering rotation/translation
    if (hull1.length !== hull2.length) return false;

    // Try rotating and matching the hulls
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
      if (match) return true; // Found a matching rotation
    }

    return false; // No match found
  }

  // Function to find the starting point (the leftmost point)
  function findStartingPoint(cluster) {
    // Find the leftmost point based on the smallest x-coordinate (or any other criteria)
    let startingPoint = cluster[0];
    for (let i = 1; i < cluster.length; i++) {
      if (cluster[i].x < startingPoint.x) {
        startingPoint = cluster[i];
      }
    }
    return startingPoint;
  }

  // DBSCAN clustering
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

  // Group the points using DBSCAN
  const groups = groupPointsDBSCAN(vertices);

  // Iterate over the groups and combine similar clusters
  groups.forEach((group, i) => {
    if (explored.has(i)) return;

    // Identify the starting point of the shape using findStartingPoint
    const startingPoint = findStartingPoint(group);

    const currentComponent = [group];

    for (let j = i + 1; j < groups.length; j++) {
      if (!explored.has(j) && areClustersEquivalent(group, groups[j])) {
        currentComponent.push(groups[j]);
        explored.add(j);
      }
    }

    // Add the current component to the results
    components.push({ partId: i + 1, startingPoint, clusters: currentComponent.flat() });
    explored.add(i);
  });

  return components;
}
