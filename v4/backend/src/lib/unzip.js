// Minimal, defensive ZIP reader (no dependencies): reads the central directory and inflates entries
// in memory. Nothing is written to disk and nothing is executed.
// Guards: max entries, per-file and total uncompressed size (zip-bomb safe via maxOutputLength),
// no encrypted / ZIP64 / unsupported-compression entries, path traversal names rejected.
import zlib from 'node:zlib';
import { AppError } from './errors.js';

export const ZIP_LIMITS = { maxEntries: 2000, maxFileBytes: 300 * 1024, maxTotalBytes: 6 * 1024 * 1024 };

const bad = (m) => new AppError('VALIDATION_ERROR', m);

export function readZip(buf, { filter = () => true, limits = ZIP_LIMITS } = {}) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw bad('That file is not a valid .zip');
  // End of central directory record (last 22..65557 bytes)
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw bad('That file is not a valid .zip (no central directory)');
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw bad('ZIP64 archives are not supported — please re-zip with standard settings');
  if (count > limits.maxEntries) throw bad(`The zip has ${count} entries; the limit is ${limits.maxEntries}`);

  const files = [];
  const skipped = [];
  let total = 0;
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw bad('Corrupt zip (central directory)');
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const rawName = buf.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x800 ? 'utf8' : 'latin1');
    p += 46 + nameLen + extraLen + commentLen;

    const name = rawName.replace(/\\/g, '/');
    if (name.endsWith('/')) continue; // directory
    if (name.startsWith('/') || name.split('/').includes('..') || /^[A-Za-z]:/.test(name)) { skipped.push({ path: name, reason: 'unsafe path' }); continue; }
    if (!filter(name)) { skipped.push({ path: name, reason: 'not a source file' }); continue; }
    if (flags & 0x1) { skipped.push({ path: name, reason: 'encrypted' }); continue; }
    if (size > limits.maxFileBytes) { skipped.push({ path: name, reason: `too large (${Math.round(size / 1024)} KB)` }); continue; }
    if (total + size > limits.maxTotalBytes) { skipped.push({ path: name, reason: 'zip size budget reached' }); continue; }
    if (localOff + 30 > buf.length || buf.readUInt32LE(localOff) !== 0x04034b50) throw bad('Corrupt zip (local header)');
    const dataStart = localOff + 30 + buf.readUInt16LE(localOff + 26) + buf.readUInt16LE(localOff + 28);
    const data = buf.subarray(dataStart, dataStart + compSize);
    let out;
    try {
      if (method === 0) out = data;
      else if (method === 8) out = zlib.inflateRawSync(data, { maxOutputLength: limits.maxFileBytes });
      else { skipped.push({ path: name, reason: `unsupported compression (${method})` }); continue; }
    } catch {
      skipped.push({ path: name, reason: 'could not be decompressed' }); continue;
    }
    if (out.length > limits.maxFileBytes) { skipped.push({ path: name, reason: 'too large' }); continue; }
    total += out.length;
    if (out.subarray(0, 8000).includes(0)) { skipped.push({ path: name, reason: 'binary file' }); continue; }
    files.push({ path: name, content: out.toString('utf8') });
  }
  return { files, skipped };
}
