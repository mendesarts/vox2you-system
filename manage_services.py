import subprocess
import os
import time
import signal
import sys

def run_command(cmd, cwd=None, bg=False):
    print(f"Running: {cmd} in {cwd}")
    try:
        if bg:
            # Open devnull to detach stdin/out/err to prevent hanging
            with open('service_log.txt', 'a') as log:
                subprocess.Popen(cmd, cwd=cwd, shell=True, stdout=log, stderr=log, preexec_fn=os.setpgrp)
        else:
            subprocess.run(cmd, cwd=cwd, shell=True, check=True)
    except Exception as e:
        print(f"Error: {e}")

print("Starting Service Manager...")

# 1. Kill ports
try:
    subprocess.run("lsof -ti:3000 | xargs kill -9", shell=True)
    subprocess.run("lsof -ti:5173 | xargs kill -9", shell=True)
except:
    pass
print("Ports cleared.")

# 2. Check Node
try:
    node_v = subprocess.check_output("node -v", shell=True).decode().strip()
    print(f"Node Version: {node_v}")
except:
    print("Node not found in shell path?")

base_dir = os.getcwd()
server_dir = os.path.join(base_dir, 'server')
client_dir = os.path.join(base_dir, 'client')

# 3. Start Server
print("Starting Server...")
run_command("node index.js", cwd=server_dir, bg=True)
# run_command("nohup node index.js > server.log 2>&1 &", cwd=server_dir) # Python Popen is better

# 4. Start Client
print("Starting Client...")
run_command("npm run dev -- --host", cwd=client_dir, bg=True)

print("Services launched in background. Monitoring for 5 seconds...")
time.sleep(5)

# 5. Check Output
try:
    valid_3000 = subprocess.check_output("lsof -i :3000", shell=True).decode()
    print("Port 3000 Active!")
except:
    print("Port 3000 Inactive.")

try:
    valid_5173 = subprocess.check_output("lsof -i :5173", shell=True).decode()
    print("Port 5173 Active!")
except:
    print("Port 5173 Inactive.")

print("Done.")
