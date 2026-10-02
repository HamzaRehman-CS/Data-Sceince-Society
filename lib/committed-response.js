'use strict';

// Do not report a successful write or issue a session cookie before COMMIT.
async function committedResponse(res, transaction) {
  const methods = ['writeHead', 'write', 'end', 'flushHeaders'];
  const originals = Object.fromEntries(methods.map(name => [name, res[name]]));
  const headers = { ...res.getHeaders() };
  const status = res.statusCode;
  const pending = [];
  for (const name of methods) if (typeof originals[name] === 'function') {
    res[name] = (...args) => { pending.push([name, args]); return name === 'write' ? true : res; };
  }
  const restore = () => { for (const name of methods) if (originals[name]) res[name] = originals[name]; };
  try {
    await transaction();
  } catch (error) {
    restore();
    for (const name of res.getHeaderNames()) res.removeHeader(name);
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    res.statusCode = status;
    throw error;
  }
  restore();
  for (const [name, args] of pending) originals[name].apply(res, args);
}
module.exports = { committedResponse };
