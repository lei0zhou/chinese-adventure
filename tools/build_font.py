#!/usr/bin/env python3
"""Subset Noto Sans SC (SIL OFL 1.1) to the characters the app uses -> fonts/*.woff2.
Usage: python3 tools/build_font.py /path/to/NotoSansSC-Regular.ttf /path/to/NotoSansSC-Bold.ttf  (pip install fonttools brotli)"""
import os, sys
from fontTools import subset
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = open(os.path.join(ROOT, "tools", "charset.txt"), encoding="utf-8").read()
import glob
for f in glob.glob(os.path.join(ROOT, "js", "*.js")) + [os.path.join(ROOT, "index.html")]:
    chars += "".join(c for c in open(f, encoding="utf-8").read() if "\u4e00" <= c <= "\u9fff")
chars += "。！？，、：“”；…—·「」（）《》０１２３４５６７８９"
latin = "".join(chr(c) for c in list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x1CD, 0x1DD)))
for src, name in zip(sys.argv[1:3], ["NotoSansSC-Regular.woff2", "NotoSansSC-Bold.woff2"]):
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["*"]; opts.name_IDs = ["*"]
    font = subset.load_font(src, opts)
    s = subset.Subsetter(opts); s.populate(text=chars + latin); s.subset(font)
    out = os.path.join(ROOT, "fonts", name); subset.save_font(font, out, opts)
    print(out, os.path.getsize(out))
