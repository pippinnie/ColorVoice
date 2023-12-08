// Create a list of color objects based on the color list from color.js
const MAP_COLORS = Object.entries(COLORS).map(([name, hexColor]) => {
  return {
    name,
    source: hexColor,
    rgb: hexToRgb(hexColor),
  };
});

// Convert colors from Hex to RGB
function hexToRgb(hexColor) {
  // Check if color code format is valid
  if (
    !hexColor.startsWith("#") ||
    (hexColor.length !== 4 && hexColor.length !== 7)
  ) {
    throw new Error("Invalid hex color!");
  }

  hexColor = hexColor.substring(1);
  if (hexColor.length === 3) {
    hexColor = [
      hexColor.charAt(0) + hexColor.charAt(0),
      hexColor.charAt(1) + hexColor.charAt(1),
      hexColor.charAt(2) + hexColor.charAt(2),
    ];
  } else {
    hexColor = [
      hexColor.substring(0, 2),
      hexColor.substring(2, 4),
      hexColor.substring(4, 6),
    ];
  }

  // Change from 16 base to 255 base
  const red = parseInt(hexColor[0], 16);
  const green = parseInt(hexColor[1], 16);
  const blue = parseInt(hexColor[2], 16);

  return { r: red, g: green, b: blue };
}

function euclideanDistance(colorA, colorB) {
  return Math.sqrt(
    Math.pow(colorA.r - colorB.r, 2) +
      Math.pow(colorA.g - colorB.g, 2) +
      Math.pow(colorA.b - colorB.b, 2)
  );
}

// Match the detected color with the closest color from the color list
function findColor(sourceColorHex) {
  sourceColorRgb = hexToRgb(sourceColorHex);

  let minDistance = Infinity;
  let foundColor;

  // Loop over the color list
  for (var i = 0; i < MAP_COLORS.length; ++i) {
    const colorListRgb = MAP_COLORS[i].rgb;

    // Find the euclidean distance between colors
    distance = euclideanDistance(sourceColorRgb, colorListRgb);

    if (distance < minDistance) {
      minDistance = distance;
      foundColor = MAP_COLORS[i];
    }
  }

  return {
    name: foundColor.name,
    value: foundColor.source,
    rgb: foundColor.rgb,
    distance: Math.sqrt(minDistance),
  };
}
