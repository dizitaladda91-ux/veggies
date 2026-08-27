const fs = require('fs');
const path = require('path');

const writeHealthSnapshot = (status, details) => {
  const outputPath = path.join(__dirname, '../../.health.json');
  fs.writeFileSync(outputPath, JSON.stringify({ status, details, timestamp: new Date().toISOString() }, null, 2));
};

module.exports = { writeHealthSnapshot };
