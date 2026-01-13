#!/bin/bash
# FINAL RESTART SCRIPT

# 1. Kill Everything
echo "Clean up..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# 2. Start Backend
echo "Starting Backend..."
cd server
export PORT=3000
nohup node index.js > ../server.log 2>&1 &
cd ..

# 3. Start Frontend
echo "Starting Frontend..."
cd client
nohup npm run dev -- --port 5173 --host > /dev/null 2>&1 &
cd ..

echo "Services Restarted."
