declare module '@modelcontextprotocol/sdk' {
  export class Server {
    constructor(
      info: { name: string; version: string },
      capabilities: { capabilities: { tools: {} } },
      transport: any
    );
    
    setRequestHandler(requestType: any, handler: (req: any) => Promise<any>): void;
  }
}

declare module '@modelcontextprotocol/sdk/dist/cjs/server/stdio' {
  export class StdioServerTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/dist/cjs/types' {
  export const ListToolsRequest: any;
  export const CallToolRequest: any;
  
  export interface Tool {
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  }
} 