#!/bin/bash

# Kill existing processes on ports 3000 and 5173
echo "Stopping existing services..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Server
echo "Starting Backend..."
cd server
nohup node index.js > ../server/server.log 2>&1 &
SERVER_PID=$!
echo "Backend started with PID $SERVER_PID"

# Wait a bit for server to initialize
sleep 2

# Start Client
echo "Starting Frontend..."
cd ../client
nohup npm run dev > ../client/client.log 2>&1 &
CLIENT_PID=$!
echo "Frontend started with PID $CLIENT_PID"

echo "Environment Restarted!"
