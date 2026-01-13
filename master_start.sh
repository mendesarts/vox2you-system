#!/bin/bash
LOGfile="/Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/MASTER_LOG.txt"
echo "--- RESETTING ---" > $LOGfile

# Kill
echo "Killing ports..." >> $LOGfile
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Client Install (Safety)
echo "Installing Client Deps..." >> $LOGfile
cd client
npm install >> $LOGfile 2>&1
cd ..

# Start Server
echo "Starting Backend..." >> $LOGfile
cd server
pwd >> $LOGfile
nohup node index.js >> $LOGfile 2>&1 &
SERVER_PID=$!
echo "Backend PID: $SERVER_PID" >> $LOGfile

# Start Client
echo "Starting Frontend..." >> $LOGfile
cd ../client
pwd >> $LOGfile
# Add --host to expose to network if needed, but local is fine.
nohup npm run dev -- --host >> $LOGfile 2>&1 &
CLIENT_PID=$!
echo "Client PID: $CLIENT_PID" >> $LOGfile

echo "DONE." >> $LOGfile
