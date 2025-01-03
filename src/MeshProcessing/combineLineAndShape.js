export function combineLineAndShape(parts, threshold = 0.5) {
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
