import os
import glob
import shutil

# Paths
HOME = os.path.expanduser("~")
SOURCE_DIR = os.path.join(HOME, ".claude/commands")
TARGET_DIR = ".agent/workflows"

# Ensure target directory exists
os.makedirs(TARGET_DIR, exist_ok=True)

print(f"Scanning {SOURCE_DIR}...")

if not os.path.exists(SOURCE_DIR):
    print(f"Source directory not found: {SOURCE_DIR}")
    exit(1)

files = glob.glob(os.path.join(SOURCE_DIR, "*.md"))
print(f"Found {len(files)} commands.")

for file_path in files:
    filename = os.path.basename(file_path)
    target_path = os.path.join(TARGET_DIR, filename)
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add YAML frontmatter if missing
    if not content.strip().startswith("---"):
        command_name = os.path.splitext(filename)[0]
        new_content = f"""---
description: Imported Claude Code command '{command_name}'
---

{content}
"""
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Converted and imported: {filename}")
    else:
        # If it already has frontmatter, just copy
        shutil.copy2(file_path, target_path)
        print(f"Copied: {filename}")

print("Import completed.")
