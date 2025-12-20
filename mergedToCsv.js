#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function flattenObject(obj, prefix = '', out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function collectNumericKeys(rows) {
  const keys = new Set();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      const v = r[k];
      if (typeof v === 'number' || (!isNaN(Number(v)) && v !== null && v !== '')) keys.add(k);
    }
  }
  return Array.from(keys).sort();
}

function toCsv(header, rows) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [];
  lines.push(header.join(','));
  for (const r of rows) {
    const row = header.map(h => esc(h === 'tick' ? r[h] : (r[h] != null ? r[h] : '')));
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function main() {
  const arg = process.argv[2];
  const jsonPath = arg || path.join(__dirname, 'runs', 'merged', 'json', 'merged-1_30.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Merged JSON not found:', jsonPath);
    process.exit(1);
  }
  const content = fs.readFileSync(jsonPath, 'utf8');
  let obj;
  try { obj = JSON.parse(content); } catch (e) { console.error('Invalid JSON', e.message); process.exit(1); }

  const runData = Array.isArray(obj.runData) ? obj.runData : obj;
  const ticks = [];
  for (const ev of runData) {
    if (!Array.isArray(ev) || ev.length === 0) continue;
    if (ev[0] === 'timer-tick' && ev[1] && typeof ev[1] === 'object') {
      const flat = flattenObject(ev[1]);
      // normalize tick
      flat.tick = flat.tick || flat.tickNumber || null;
      ticks.push(flat);
    }
  }

  // sort ticks numerically when possible
  ticks.sort((a,b)=> {
    const an = Number(a.tick);
    const bn = Number(b.tick);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return String(a.tick).localeCompare(String(b.tick));
  });

  const numericKeys = collectNumericKeys(ticks);
  // ensure tick is first column
  const header = ['tick', ...numericKeys.filter(k=>k!=='tick')];

  const csvRows = ticks.map(t=>{
    const row = {};
    for (const h of header) row[h] = t[h] != null ? t[h] : '';
    return row;
  });

  const outDir = path.join(__dirname, 'runs', 'merged', 'csv');
  ensureDir(outDir);
  const base = path.basename(jsonPath, '.json');
  const outPath = path.join(outDir, base + '.csv');
  const csv = toCsv(header, csvRows);
  fs.writeFileSync(outPath, csv);
  console.log('Wrote CSV to', outPath);
}

if (require.main === module) main();
