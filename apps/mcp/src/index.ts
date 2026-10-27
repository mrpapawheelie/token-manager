import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createTokenManagerServer } from "./server.js";

const server = createTokenManagerServer();
await server.connect(new StdioServerTransport());
console.error("token-manager mcp ready");
