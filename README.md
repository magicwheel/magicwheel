# Magicwheel: A platform for serverless applications over WebRTC #

Magicwheel is a small scale experiment demonstrating the concept of serverless applications.

Drag and drop your multiplayer game or resource sharing application to have it serverlessly published to remote browsers.

### [http://magicwheel.info](http:///magicwheel.info)

## Install
```sh
$ git clone git://github.com/magicwheel/magicwheel.git
$ npm install
```

Run the agent server on port 3000
```sh
node app.js
```

Run the peer server on port 9000
```sh
node app-peer-server.js
```

## Architecture

Magicwheel is agent-based. Once the agent is downloaded from the server, the server is no longer in use.

The agents use a signaling server (at this point a single one) to establish WebRTC data channels, over which they publish and execute multi-user applications, as well as share resources using a map-reduce strategy.

The Magicwheel application is merely a zipped html site. The html pages are presented locally by the agent as Blobs. The applications' scripts use the agent API to simplify the P2P communications and resource sharing.

## Development

The 'debug' query parameter will fetch the agent scripts non-aggregated: http://magicwheel.info?debug

The 'refresh' query parameter will rebuild the application zip on the server.

Use the /compile path to reaggregate and minify the agent scripts once changed

##Feedback

dannyhad@gmail.com

##License

MIT