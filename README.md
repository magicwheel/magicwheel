Magicwheel is a small scale experiment demonstrating the concept of serverless applications.

It uses agent-based architecture. Once the agent is downloaded from the server, the server is no longer in use.

The agents use a signaling server (at this point a single one) to establish WebRTC data channels, over which they publish and execute multi-user applications, as well as share resources using a map-reduce strategy.

The Magicwheel application is merely a zipped html site. The html pages are presented locally by the agent as Blobs. The applications' scripts use the agent API to simplify the P2P communications and resource sharing.