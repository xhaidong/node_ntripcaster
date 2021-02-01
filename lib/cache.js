'use strict';

const Sources = {};
const Rovers = {};

const addSource = (conn) => {
  if (Sources[conn.mountpoint]) {
    return false;
  }

  Sources[conn.mountpoint] = conn;
  Rovers[conn.mountpoint] = [];
  return true;
};

const addRover = (conn) => {
  if (!Rovers[conn.mountpoint]) {
    return false;
  }

  Rovers[conn.mountpoint].push(conn);
  return true;
};

const delFromSource = (conn) => {
  if (!Sources[conn.mountpoint]) {
    return;
  }

  delete Sources[conn.mountpoint];
  // clear all rovers
  for (const i in Rovers[conn.mountpoint]) {
    Rovers[conn.mountpoint][i].close();
  }

  delete Rovers[conn.mountpoint];
};

const delFromRover = (conn) => {
  if (!Rovers[conn.mountpoint]) {
    return;
  }

  let idx = -1;
  for (const i in Rovers[conn.mountpoint]) {
    if (Rovers[conn.mountpoint][i] === conn) {
      idx = i;
      break;
    }
  }

  if (idx >= 0) {
    Rovers[conn.mountpoint].splice(idx, 1);
  }
};

const forwardData = (mountpoint, data) => {
  if (!Rovers[mountpoint]) {
    return;
  }

  for (const i in Rovers[mountpoint]) {
    Rovers[mountpoint][i].write(data);
  }
}

const getTables = (isBrowser) => {
  const mountpoints = [];
  for (const k in Sources) {
    mountpoints.push(k);
  }
  mountpoints.sort();

  const tables = [];
  for (const i in mountpoints) {
    const mountpoint = mountpoints[i];
    tables.push(`STR;${mountpoint};CA;RTCM 3;1005,1074,1084,1094,1124;2;GPS+GLO+GAL+BDS;ACEINNA;USA;0.00;0.00;1;0;ACEINNA;none;N;N;3600;none`);
  }
  const table = tables.join('\r\n');

  let tableStr = '';
  if (isBrowser) {
    tableStr += [
      'HTTP/1.1 200 OK',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Encoding: UTF-8',
      'Connection: Close'
    ].join('\r\n') + '\r\n\r\n'

    tableStr += '<html><body><pre>';
  }

  const utcDate = new Date().toUTCString();
  tableStr += `SOURCETABLE 200 OK\r\n` +
    `Server: NTRIP Aceinna NTRIP Caster\r\n` +
    `Date: ${utcDate}\r\n` +
    `Content-Type: text/plain\r\n` +
    `Content-Length: ${table.length+2}\r\n\r\n` +
    `${table}\r\n` +
    `ENDSOURCETABLE\r\n`;

  if (isBrowser) {
    tableStr += '</pre></body></html>';
  }
  return tableStr;
};

module.exports = {
  addSource,
  addRover,
  delFromSource,
  delFromRover,
  forwardData,
  getTables,
};