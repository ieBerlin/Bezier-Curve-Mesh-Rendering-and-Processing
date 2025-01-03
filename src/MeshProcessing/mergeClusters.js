export function mergeClusters(parts) {
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
