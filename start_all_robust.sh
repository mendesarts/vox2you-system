#!/bin/bash
echo "Starting Start Script..." > startup_debug.txt

# Kill ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Start Backend
cd server
screen -dmS backend node index.js
echo "Backend Started in screen" >> ../startup_debug.txt

# Start Frontend
cd ../client
screen -dmS frontend npm run dev
echo "Frontend Started in screen" >> ../startup_debug.txt

echo "Done" >> ../startup_debug.txt
