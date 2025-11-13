import os
import re
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUBLIC = os.path.join(ROOT, 'public')
I18N_DIR = os.path.join(ROOT, 'assets', 'i18n')

pattern = re.compile(r'data-i18n(?:-placeholder|-alt)?\s*=\s*"([^"]+)"')

keys_found = set()
files_scanned = []
for dirpath, dirnames, filenames in os.walk(PUBLIC):
    for fn in filenames:
        if fn.endswith('.html'):
            fp = os.path.join(dirpath, fn)
            try:
                with open(fp, 'r', encoding='utf-8') as f:
                    txt = f.read()
            except Exception as e:
                print(f"Could not read {fp}: {e}")
                continue
            for m in pattern.finditer(txt):
                keys_found.add(m.group(1))
            files_scanned.append(fp)

print(f"Scanned {len(files_scanned)} HTML files under public/")
print(f"Found {len(keys_found)} unique data-i18n keys (including placeholders/alt).\n")

# load i18n json files
langs = ['en','ru','tr','de']
lang_dicts = {}
for l in langs:
    path = os.path.join(I18N_DIR, f"{l}.json")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lang_dicts[l] = json.load(f)
    except Exception as e:
        print(f"Failed to load {path}: {e}")
        lang_dicts[l] = {}

# report missing keys per language
missing = {l: [] for l in langs}
for k in sorted(keys_found):
    for l in langs:
        if k not in lang_dicts.get(l, {}):
            missing[l].append(k)

any_missing = False
for l in langs:
    if missing[l]:
        any_missing = True
        print(f"Missing in {l}.json: {len(missing[l])} keys")
        for mk in missing[l][:200]:
            print("  ", mk)
        print()
    else:
        print(f"All keys present in {l}.json")

if not any_missing:
    print("\nAll data-i18n keys found in all language JSON files.")
else:
    print("\nSome keys are missing. Please add them to the language files.")

# exit code 0
