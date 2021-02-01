'use strict';

const SOURCE = 'SOURCE';
const ROVER = 'rover';

const {
  addSource,
  addRover,
  forwardData,
  getTables,
} = require('./cache');

class Connection {
  constructor(conn) {
    this.conn = conn;

    this.isReady = false;
    this.mountpoint = '';
    this.role = '';
  }

  run() {
    this.initEvent();
  }

  initEvent() {
    this.conn.on('data', (data) => {
      this.handleData(data);
    });

    this.conn.on('close', () => {});

    this.conn.on('error', err => {});
  }

  addToCache() {
    if (this.role === SOURCE) {
      return addSource(this);
    }

    if (this.role === ROVER) {
      return addRover(this);
    }
  }

  delFromCache() {
    if (this.role === SOURCE) {
      return delFromSource(this);
    }

    if (this.role === ROVER) {
      return delFromRover(this);
    }
  }



  handleData(data) {
    if (!this.isReady) {
      const dataStr = data.toString();
      if (dataStr.startsWith('SOURCE')) {
        this.handleSource(dataStr);
      }

      if (dataStr.startsWith('GET')) {
        this.handleRover(dataStr);
      }

      return;
    }

    if (this.role === SOURCE) {
      forwardData(this.mountpoint, data);
      return;
    }
  }

  handleSource(data) {
    /**
     * data format
     * SOURCE aceinna /WX02
     * Source-Agent: NTRIP ACEINNA RELAY SERVER
     */
    const dataArr = data.split('\r\n');
    if (dataArr.length < 1) {
      this.close();
      return;
    }
    const mountStr = dataArr[0];
    const mountArr = mountStr.split(' ');
    if (mountArr.length !== 3) {
      this.close();
      return;
    }

    const mountpoint = mountArr[2].substr(1);
    this.mountpoint = mountpoint;
    this.role = SOURCE;

    const rst = this.addToCache();
    if (!rst) {
      return;
    }

    this.icy();
  }

  handleRover(data) {
    /**
     * GET /RTK HTTP/1.1
     * User-Agent: NTRIP ACEINNA/1.0
     * Authorization: Basic dGVzdDphYmNkZWQ=
     */
    const dataArr = data.split('\r\n');
    if (data.length < 1) {
      this.close();
      return;
    }
    const mountStr = dataArr[0];
    const mountArr = mountStr.split(' ');
    if (mountArr.length !== 3) {
      this.close();
      return;
    }

    const mountpoint = mountArr[1].substr(1);
    this.mountpoint = mountpoint;

    this.role = ROVER;

    if (this.mountpoint === '') {
      let isBrowser = false;
      if (mountArr[2] !== 'HTTP/1.0') {
        isBrowser = true;
      }
      const tables = getTables(isBrowser);
      this.write(tables);
      this.close();
      return;
    }

    const rst = this.addToCache();
    if (!rst) {
      this.close();
      return;
    }

    this.icy();
  }

  icy() {
    this.isReady = true;

    this.write('ICY 200 OK\r\n\r\n');
  }

  write(data) {
    if (!this.conn.destroyed) {
      this.conn.write(data);
    }
  }

  close() {
    this.conn.removeAllListeners();
    this.conn.destroy();
  }
}

module.exports = Connection;