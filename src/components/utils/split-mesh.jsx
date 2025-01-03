function combineLineAndShape(parts, threshold = 0.5) {
  let combinedParts = [];

  parts.forEach((item) => {
    if (item.partId === "_line") {
      const line = item.clusters;
      const shape = parts.find((part) => part.partId === "_shaped");
      if (shape) {
        const lineEnd = line[line.length - 1];
        const shapeStart = shape.clusters[0];

        // Check if the line and shape are aligned on the same axis (x or z)
        const isAlignedX = Math.abs(lineEnd.x - shapeStart.x) < threshold;
        const isAlignedZ = Math.abs(lineEnd.z - shapeStart.z) < threshold;

        // If aligned and within threshold distance, merge them
        if (
          (isAlignedX || isAlignedZ) &&
          Math.abs(lineEnd.x - shapeStart.x) +
            Math.abs(lineEnd.z - shapeStart.z) <
            threshold
        ) {
          // Combine the line and shape by concatenating them
          combinedParts.push({
            partId: item.partId + "_combined",
            clusters: line.concat(shape.clusters),
          });
        } else {
          // If not close enough, keep them separate
          combinedParts.push(item);
          combinedParts.push(shape);
        }
      }
    }
  });

  return combinedParts;
}

function mergeClusters(parts) {
  function checkLine(clusters, threshold = 0.2) {
    let totalX = 0;
    let totalZ = 0;
    let totalCount = 0;

    clusters.forEach((point) => {
      totalX += Math.abs(point.x);
      totalZ += Math.abs(point.z);
      totalCount++;
    });

    let avgX = totalX / totalCount;
    let avgZ = totalZ / totalCount;
    let isStableX = true;
    let isStableZ = true;

    clusters.forEach((point) => {
      if (Math.abs(Math.abs(point.x) - avgX) > threshold) {
        isStableX = false;
      }
      if (Math.abs(Math.abs(point.z) - avgZ) > threshold) {
        isStableZ = false;
      }
    });

    return isStableX || isStableZ;
  }

  let resultParts = [];

  parts.forEach((item) => {
    let lineClusters = [];
    let nonLineClusters = [];

    if (checkLine(item.clusters)) {
      resultParts.push({
        ...item,
        partId: "_line",
      });
      lineClusters.push(item);
    } else {
      resultParts.push({
        ...item,
        partId: "_shaped",
      });
      nonLineClusters.push(item);
    }
  });

  return resultParts;
}

export function combineMesh(parts) {
  return combineLineAndShape(mergeClusters(parts));
}

function retrieveComponents(vertices) {
  let components = [];
  let explored = new Set();

  function areClustersEquivalent(cluster1, cluster2, tolerance = 0.01) {
    if (cluster1.length !== cluster2.length) return false;
    for (let i = 0; i < cluster1.length; i++) {
      let matchFound = false;
      for (let j = 0; j < cluster2.length; j++) {
        let dx = Math.abs(cluster1[i].x + cluster2[j].x);
        let dz = Math.abs(cluster1[i].z + cluster2[j].z);
        if (dx < tolerance && dz < tolerance) {
          matchFound = true;
          break;
        }
      }
      if (!matchFound) return false;
    }
    return true;
  }

  function groupPointsDBSCAN(points, epsilon = 0.1, minPoints = 3) {
    let groups = [];
    let outliers = [];
    let exploredPoints = new Set();

    function neighborhoodQuery(point) {
      return points.filter(
        (v) => Math.hypot(v.x - point.x, v.z - point.z) <= epsilon
      );
    }

    function expandGroup(point, neighbors, group) {
      group.push(point);
      exploredPoints.add(point);
      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        if (!exploredPoints.has(neighbor)) {
          exploredPoints.add(neighbor);
          let newNeighbors = neighborhoodQuery(neighbor);
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
      let neighbors = neighborhoodQuery(vertex);
      if (neighbors.length < minPoints) {
        outliers.push(vertex);
      } else {
        let group = [];
        expandGroup(vertex, neighbors, group);
        groups.push(group);
      }
    });

    return groups;
  }

  let groups = groupPointsDBSCAN(vertices);

  for (let i = 0; i < groups.length; i++) {
    if (explored.has(i)) continue;
    let currentComponent = [groups[i]];
    for (let j = i + 1; j < groups.length; j++) {
      if (!explored.has(j) && areClustersEquivalent(groups[i], groups[j])) {
        currentComponent.push(groups[j]);
        explored.add(j);
      }
    }
    components.push(currentComponent);
    explored.add(i);
  }

  components = components.map((component) => {
    return component.map((group) => {
      return group.map((point) => ({
        ...point,
      }));
    });
  });

  return components.map((component, index) => ({
    partId: index + 1,
    clusters: component.flat(),
  }));
}

export function segmentMesh(vertices) {
  let processedVertices = [];
  vertices.forEach((element) =>
    processedVertices.push({ x: element.x, z: element.z })
  );

  return retrieveComponents(vertices);
}

