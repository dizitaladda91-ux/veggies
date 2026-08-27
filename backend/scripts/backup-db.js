const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is required for backup');
  process.exit(1);
}
const outputPath = path.join(__dirname, '..', 'backups', `backup-${Date.now()}.sql`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
execSync(`pg_dump "${dbUrl}" > "${outputPath}"`, { stdio: 'inherit' });
console.log(`Database backup written to ${outputPath}`);
