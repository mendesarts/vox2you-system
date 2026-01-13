import sys

file_path = 'client/src/pages/CRMBoard.jsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

# Find Start
for i in range(len(lines)):
    if "{/* Modal de Filtros Avançados */}" in lines[i]:
        start_idx = i
        break
    if "showFilterModal && (" in lines[i] and "VoxModal" in lines[i+1]: # fallback
         start_idx = i
         break

if start_idx == -1:
    print("Could not find start of Filter Modal block")
    sys.exit(1)

# Find End
# Looking for closing of the block.
# The block starts at start_idx (comment) or start_idx+1 (showFilterModal)
# It ends with `)}` after `</VoxModal>`
for i in range(start_idx, len(lines)):
    if "</VoxModal>" in lines[i]:
        # The next line is `            )}` usually
        if ")}" in lines[i+1]:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find end of Filter Modal block")
    sys.exit(1)

print(f"Replacing lines {start_idx+1} to {end_idx+1}")

new_content = """            {/* Modal de Filtros Avançados */}
            {showFilterModal && (
                <FilterModal
                    isOpen={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    filters={activeFilters}
                    setFilters={setActiveFilters}
                    consultants={consultants}
                    leads={leads}
                    units={units}
                    user={user}
                    globalRole={GLOBAL_VIEW_ROLES.includes(Number(user?.roleId))}
                />
            )}
"""

lines[start_idx : end_idx + 1] = [new_content]

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Success")
