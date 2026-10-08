#!/usr/bin/env python3
"""Write sw.js with the full precache list and a content-hash cache version. Run after any change."""
import hashlib, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCLUDE_DIRS = ["css", "js", "data", "vendor", "fonts", "assets"]
files = ["./", "index.html", "manifest.webmanifest"]
for d in INCLUDE_DIRS:
    for dp, _, fns in os.walk(os.path.join(ROOT, d)):
        for fn in sorted(fns):
            rel = os.path.relpath(os.path.join(dp, fn), ROOT).replace(os.sep, "/")
            if rel.endswith((".LICENSE", ".TXT", ".txt")): continue
            files.append(rel)
files = sorted(set(files), key=lambda f: (f != "./", f))
h = hashlib.sha256()
for f in files:
    if f == "./": continue
    h.update(f.encode()); h.update(open(os.path.join(ROOT, f), "rb").read())
version = h.hexdigest()[:12]
tmpl = open(os.path.join(ROOT, "tools", "sw.template.js"), encoding="utf-8").read()
out = tmpl.replace("__VERSION__", version).replace("__FILES__", ",\n  ".join('"%s"' % f for f in files))
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(out)
print("sw.js version", version, "files", len(files))
