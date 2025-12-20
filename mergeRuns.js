#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseIndices(args) {
  // args: ['1','2','5-7'] etc
  const indices = new Set();
  args.forEach(a => {
    if (a.includes('-')) {
      const [s,e] = a.split('-').map(Number);
      if (Number.isInteger(s) && Number.isInteger(e) && s <= e) {
        for (let i = s; i <= e; i++) indices.add(i);
      }
    } else {
      const n = Number(a);
      if (Number.isInteger(n)) indices.add(n);
    }
  });
  return Array.from(indices).sort((a,b)=>a-b);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function deepMergeTick(target, source) {
  // merge source into target, adding only new keys for nested objects
  // preserve arrays and primitives by overwriting if target lacks them
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    const tVal = target[key];
    if (sVal && typeof sVal === 'object' && !Array.isArray(sVal)) {
      if (!tVal || typeof tVal !== 'object' || Array.isArray(tVal)) {
        // copy whole object
        target[key] = JSON.parse(JSON.stringify(sVal));
      } else {
        // both objects -> add missing keys only (deduplicate by key)
        for (const k of Object.keys(sVal)) {
          if (!(k in tVal)) {
            tVal[k] = sVal[k];
          } else {
            // nested level: if both are objects, recurse to add missing fields
            if (sVal[k] && typeof sVal[k] === 'object' && !Array.isArray(sVal[k]) && tVal[k] && typeof tVal[k] === 'object' && !Array.isArray(tVal[k])) {
              deepMergeTick(tVal[k], sVal[k]);
            }
            // otherwise skip - target retains its value
          }
        }
      }
    } else {
      // primitive or array: if target doesn't have the key, set it; else keep target
      if (!(key in target)) target[key] = sVal;
    }
  }
}

function mergeRunDatas(runDatas) {
  // runDatas: array of arrays like from each file's runData
  // We'll build a map of tick -> merged object, and also keep non-tick events in order

  const tickMap = new Map();
  const orderedTicks = new Set();
  const mergedEvents = [];

  // iterate through each file's runData in the order provided (low to high index)
  for (const runData of runDatas) {
    for (const event of runData) {
      if (!Array.isArray(event) || event.length === 0) continue;
      const evName = event[0];
      if (evName === 'timer-tick' && event[1] && typeof event[1] === 'object') {
        const tick = event[1].tick || event[1].tickNumber || null;
        // some files may store tick as string; keep as string for key
        const tickKey = tick != null ? String(tick) : null;
        if (!tickKey) {
          // fallback: push as-is
          mergedEvents.push(event);
          continue;
        }
        orderedTicks.add(tickKey);
        if (!tickMap.has(tickKey)) {
          // clone the object to avoid mutating source
          tickMap.set(tickKey, JSON.parse(JSON.stringify(event[1])));
        } else {
          deepMergeTick(tickMap.get(tickKey), event[1]);
        }
      } else {
        // non-tick events: preserve order but avoid exact duplicates
        const serialized = JSON.stringify(event);
        if (!mergedEvents._seen) mergedEvents._seen = new Set();
        if (!mergedEvents._seen.has(serialized)) {
          mergedEvents._seen.add(serialized);
          mergedEvents.push(event);
        }
      }
    }
  }

  // produce final runData: start with non-tick events in their original relative order,
  // then insert timer-tick events in ascending tick order
  const final = [];
  // include non-tick events (filtered)
  for (const ev of mergedEvents) {
    final.push(ev);
  }

  // sort tick keys numerically if possible
  const tickKeys = Array.from(orderedTicks);
  tickKeys.sort((a,b)=> {
    const an = Number(a);
    const bn = Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return a.localeCompare(b);
  });

  for (const tk of tickKeys) {
    final.push(['timer-tick', tickMap.get(tk)]);
  }

  return final;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node mergeRuns.js <indices...>');
    console.error('Example: node mergeRuns.js 1 2 5-7');
    process.exit(2);
  }

  const indices = parseIndices(args);
  if (indices.length === 0) {
    console.error('No valid indices parsed');
    process.exit(2);
  }

  const rawDir = path.join(__dirname, 'runs', 'raw');
  const outDir = path.join(__dirname, 'runs', 'merged', 'json');
  ensureDir(outDir);

  const runDatas = [];
  const missing = [];
  for (const i of indices) {
    const f = path.join(rawDir, `runData-${i}.json`);
    if (!fs.existsSync(f)) {
      missing.push(i);
      continue;
    }
    const content = fs.readFileSync(f, 'utf8');
    let obj;
    try { obj = JSON.parse(content); } catch (err) { console.error('Invalid JSON in', f); process.exit(1); }
    if (Array.isArray(obj.runData)) runDatas.push(obj.runData);
    else if (Array.isArray(obj)) runDatas.push(obj);
    else runDatas.push([]);
  }

  if (missing.length) console.warn('Warning: missing files for indices', missing.join(','));

  const merged = mergeRunDatas(runDatas);
  const outName = `merged-${indices.join('_')}.json`;
  const outPath = path.join(outDir, outName);

  const outObj = { runData: merged };
  fs.writeFileSync(outPath, JSON.stringify(outObj, null, 2));
  console.log('Wrote merged file to', outPath);
}

if (require.main === module) main();
