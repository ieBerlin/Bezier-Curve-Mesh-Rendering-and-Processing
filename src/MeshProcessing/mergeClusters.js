export function mergeClusters(parts) {
  // Function to check if the clusters represent a line
  function checkLine(clusters, threshold = 0.12) {
    const total = clusters.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.z += point.z;
        acc.count++;
        return acc;
      },
      { x: 0, z: 0, count: 0 }
    );

    const avgX = total.x / total.count;
    const avgZ = total.z / total.count;

    return clusters.every(
      (point) =>
        Math.abs(point.x - avgX) <= threshold ||
        Math.abs(point.z - avgZ) <= threshold
    );
  }

  function calculateMinMax(clusters) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    clusters.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.z < minZ) minZ = point.z;
      if (point.z > maxZ) maxZ = point.z;
    });

    return { minX, maxX, minZ, maxZ };
  }

  // Iterate over parts, apply min/max calculation and partId assignment
  return parts.map((item) => {
    const partId = checkLine(item.clusters) ? "_line" : "_shaped";
    const { minX, maxX, minZ, maxZ } = calculateMinMax(item.clusters);
    return { ...item, partId, minX, maxX, minZ, maxZ };
  });
}
