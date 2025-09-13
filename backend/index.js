const express = require('express');
const bodyParser = require('body-parser');
const convert = require('./convert');
const path = require('path');


const app = express();
app.use(bodyParser.text({ type: '*/*', limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// Convert endpoint: expects raw text (Oracle SQL/PLSQL) in the body
app.post('/api/convert', async (req, res) => {
const oracleSql = req.body || '';
if (!oracleSql || oracleSql.trim().length === 0) {
return res.status(400).json({ error: 'Empty input' });
}
try {
const pgsql = await convert(oracleSql);
res.json({ pgsql });
} catch (err) {
console.error('Conversion error', err);
res.status(500).json({ error: String(err) });
}
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on port ${port}`));