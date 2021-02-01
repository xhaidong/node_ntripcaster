### node_ntripcaster
A simple ntripcaster service

This service only supports the Ntripcaster v1 protocol, and ignores the base station data format, and forwards the specified mountpoint data to the client.

## Config
config/config.json
```json
{
  "port": "201", // The port the service listens on
}
```

## Run
```bash
npm run start
```