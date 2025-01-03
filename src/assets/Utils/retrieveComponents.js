export function retrieveComponents(vertices) {
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
