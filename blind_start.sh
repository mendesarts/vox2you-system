#!/bin/bash
# BLIND START V3

# Kill
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Clean client deps
cd client
rm -rf node_modules
npm install
cd ..

# Start Server
cd server
nohup node index.js > /dev/null 2>&1 &
cd ..

# Start Client
cd client
nohup npm run dev -- --host > /dev/null 2>&1 &
cd ..

echo "BLIND START COMPLETE"
