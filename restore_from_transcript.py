import json
import re
import os

transcript_path = '/Users/saagnikdey/.gemini/antigravity-ide/brain/f4a51c59-bf7d-49e6-90e6-97f24be4870e/.system_generated/logs/transcript_full.jsonl'

files_to_restore = [
    '/Users/saagnikdey/KA-RYO/takeover/src/app/globals.css',
    '/Users/saagnikdey/KA-RYO/takeover/src/components/OwnerShell.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/page.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/inbox/page.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/deals/[id]/page.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/quotes/[id]/page.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/invoices/[id]/page.tsx',
    '/Users/saagnikdey/KA-RYO/takeover/src/app/q/[token]/page.tsx'
]

# We will look for view_file output which has "The following code has been modified to include a line number"
# Or we can look for the FIRST multi_replace_file_content or replace_file_content target content.
# Actually, the view_file output is the safest.

restored_files = {}

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'TOOL_RESPONSE' and data.get('tool_name') == 'default_api:view_file':
                content = data.get('content', '')
                for file_path in files_to_restore:
                    encoded_path = file_path.replace('[', '%5B').replace(']', '%5D')
                    if f"File Path: `file://{encoded_path}`" in content or f"File Path: `file://{file_path}`" in content:
                        # Extract content
                        # It starts after "The following code has been modified to include a line number before every line... \n"
                        # and ends before "The above content shows the entire..."
                        try:
                            start_marker = "The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.\n"
                            end_marker = "\nThe above content shows the entire, complete file contents of the requested file."
                            
                            start_idx = content.find(start_marker)
                            end_idx = content.find(end_marker)
                            
                            if start_idx != -1 and end_idx != -1:
                                raw_code = content[start_idx + len(start_marker):end_idx]
                                # Remove line numbers
                                clean_code = re.sub(r'^\d+: ', '', raw_code, flags=re.MULTILINE)
                                
                                # Store the FIRST instance we see, as it's the oldest (before edits)
                                if file_path not in restored_files:
                                    restored_files[file_path] = clean_code
                        except Exception as e:
                            print(f"Error parsing {file_path}: {e}")
        except json.JSONDecodeError:
            pass

for filepath, content in restored_files.items():
    print(f"Restoring {filepath}...")
    with open(filepath, 'w') as out_f:
        out_f.write(content)
print(f"Restored {len(restored_files)} files.")

