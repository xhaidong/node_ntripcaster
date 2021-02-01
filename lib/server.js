'use strict';

const net = require('net');
const config = require('../config/config.json');
const Connection = require('./connection');

const run = () => {
  const server = net.createServer();

  server.on('connection', (conn) => {
    const connection = new Connection(conn);
    connection.run();
  });

  server.listen({
    port: config.port || 2101
  }, (err) => {
    if (err) {
      throw err;
    }
  });
};

module.exports = {
  run
};