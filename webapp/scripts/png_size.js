/* Minimal PNG dimension reader (IHDR width/height) for aspect-safe ImageRun. */
const fs = require("fs");

function pngSize(file) {
  const buf = fs.readFileSync(file);
  // PNG signature 8 bytes + IHDR chunk: width at offset 16, height at offset 20
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

/** docx ImageRun transformation preserving aspect ratio at displayWidth px. */
function png(file, displayWidth) {
  const { width, height } = pngSize(file);
  const w = displayWidth;
  const h = Math.round(displayWidth * (height / width));
  return { width: w, height: h };
}

module.exports = { pngSize, png };
