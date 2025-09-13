const fs = require('fs').promises;
const { execFile } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const path = require('path');


function execFileP(cmd, args, opts = {}) {
return new Promise((resolve, reject) => {
execFile(cmd, args, opts, (err, stdout, stderr) => {
if (err) return reject({ err, stdout, stderr });
resolve({ stdout, stderr });
});
});
}


module.exports = async function convert(oracleSql) {
const id = uuidv4();
const tmpDir = '/tmp/ora2pg_snippets';
await fs.mkdir(tmpDir, { recursive: true });
const inFile = path.join(tmpDir, `${id}_in.sql`);
const outFile = path.join(tmpDir, `${id}_out.sql`);


await fs.writeFile(inFile, oracleSql, 'utf8');


// Use ora2pg with a minimal config. The config shipped in the repo is at backend/ora2pg.conf
// Note: Depending on your Ora2Pg installation and version, CLI args may vary. This call
// attempts to run Ora2Pg in "input file" mode and write an output file.
// If your Ora2Pg requires different flags, modify this command.
const configPath = path.join(__dirname, 'ora2pg.conf');


try {
// Example invocation — best effort. Adjust if your environment requires different args.
await execFileP('ora2pg', ['-c', configPath, '-i', inFile, '-o', outFile], { timeout: 20000 });
} catch (e) {
// If the CLI call fails, capture whatever stdout/stderr is present
if (e.stdout || e.stderr) {
const combined = `${e.stdout || ''}\n${e.stderr || ''}`;
// Attempt to return the CLI output as part of the error so you can debug
throw new Error(`ora2pg failed: ${combined}`);
}
throw new Error('ora2pg execution failed: ' + (e.err || JSON.stringify(e)));
}


// Read result (if produced)
let result = '';
try {
result = await fs.readFile(outFile, 'utf8');
} catch (e) {
// If output file not present, return an error with logs
throw new Error('No output produced. Check ora2pg logs.');
}


// Clean up (best-effort)
try { await fs.unlink(inFile); } catch (e) {}
try { await fs.unlink(outFile); } catch (e) {}


return result;
};