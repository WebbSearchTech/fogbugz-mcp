#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Start the MCP server as a child process
const server = spawn('node', [path.join(__dirname, '../dist/index.js')], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Flag to track if we're still testing
let testing = true;

// Listen for output from the server
server.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  
  for (const line of lines) {
    if (line.startsWith('{')) {
      try {
        // Try to parse as JSON
        const response = JSON.parse(line);
        console.log('\nMCP Response:', JSON.stringify(response, null, 2));
        
        // If we received a tool list response, call a tool
        if (testing && response.result && response.result.tools) {
          testing = false;
          console.log('\nSending tool call request...');
          server.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'mcp.callTool',
            params: {
              name: 'fogbugz_list_my_cases',
              arguments: {}
            }
          }) + '\n');
        }
      } catch (e) {
        // Not JSON, just log normally
        console.log(`Server output: ${line}`);
      }
    } else {
      console.log(`Server output: ${line}`);
    }
  }
});

// Handle server process exit
server.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
  process.exit(code);
});

// Listen for stdin to terminate the test
process.stdin.on('data', (data) => {
  if (data.toString().trim() === 'q') {
    console.log('Ending test...');
    server.kill();
    process.exit(0);
  }
});

// Send a request to list tools
console.log('Sending listTools request...');
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'mcp.listTools',
  params: {}
}) + '\n');

console.log('Test script running. Press "q" to quit.'); 