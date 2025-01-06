export function mergeClusters(parts) {
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

  return parts.map((item) => {
    const partId = checkLine(item.clusters) ? "_line" : "_shaped";
    return { ...item, partId };
  });
}