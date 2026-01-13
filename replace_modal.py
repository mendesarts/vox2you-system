import sys

file_path = 'client/src/pages/CRMBoard.jsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

start_line = 1898 - 1
end_line = 2452 - 1

# Verification
if "showNewLeadModal && (" not in lines[start_line]:
    print(f"Error: Line {start_line+1} does not match expected start. Found: {lines[start_line].strip()}")
    sys.exit(1)

if "}" not in lines[end_line].strip():
    print(f"Error: Line {end_line+1} does not match expected end (curly brace). Found: {lines[end_line].strip()}")
    sys.exit(1)

print(f"Verified range {start_line+1} to {end_line+1}. Replacing...")

new_content = """            {showNewLeadModal && (
                <LeadDetailsModal
                    isOpen={showNewLeadModal}
                    onClose={() => {
                        setShowNewLeadModal(false);
                        setSelectedLead(null);
                        setFormStep(1);
                        setNewLead(getInitialLeadState());
                    }}
                    lead={selectedLead || { ...newLead, id: 0 }}
                    onSave={handleCreateLead}
                    isReadOnly={false}
                />
            )}
"""

# Replace lines
lines[start_line : end_line + 1] = [new_content]

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Success.")
