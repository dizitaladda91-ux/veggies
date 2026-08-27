const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dbUrl = process.env.DATABASE_URL;
const backupFile = process.argv[2] || path.join(__dirname, '..', 'backups', 'latest.sql');
if (!dbUrl) {
  console.error('DATABASE_URL is required for restore');
  process.exit(1);
}
if (!fs.existsSync(backupFile)) {
  console.error(`Backup file not found: ${backupFile}`);
  process.exit(1);
}
execSync(`psql "${dbUrl}" < "${backupFile}"`, { stdio: 'inherit' });
console.log(`Database restored from ${backupFile}`);
