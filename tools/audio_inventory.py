#!/usr/bin/env python3
"""List every Chinese string the app can speak, with its reference pinyin.

Mirrors the App.say() call sites in js/*.js. Used by tools/build_audio.py.
Each item: {"text": hanzi as passed to App.say, "py": pinyin (space separated syllables), "kind": ...}
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUNCT_ENDS = "。！？，、：“”；…—"
# Grown-ups / voice panel "Test" button
EXTRA = [([["你好", "nǐ hǎo"], ["！", ""], ["我们", "wǒmen"], ["一起", "yìqǐ"], ["学", "xué"], ["中文", "Zhōngwén"], ["吧", "ba"], ["！", ""]], "test")]

def load_content():
    s = open(os.path.join(ROOT, "data", "content.js"), encoding="utf-8").read()
    return json.JSONDecoder().raw_decode(s[s.index("{"):])[0]

def inventory():
    C = load_content()
    items, seen = [], {}
    def add(text, py, kind, tokens=None):
        py = re.sub(r"\s+", " ", py.replace("_", " ")).strip()
        tokens = tokens or [[text, py]]
        if text in seen:
            it = seen[text]
            if kind not in it["kinds"]: it["kinds"].append(kind)
            if py.lower().replace(" ", "") != it["py"].lower().replace(" ", ""):
                it.setdefault("alt_py", []).append(py)
            return
        it = {"text": text, "py": py, "kinds": [kind], "tokens": tokens}
        seen[text] = it; items.append(it)
    tok_text = lambda toks: "".join(t[0] for t in toks)
    tok_py = lambda toks: " ".join(t[1] if t[1] else t[0] for t in toks)
    for w in C["words"]: add(w["hz"], w["py"], "word")
    for d in C["toneDemo"]: add(d["hz"], d["py"], "tonedemo")
    for t in C["toneItems"]: add(t["hz"], t["py"], "tone")
    for t in C["tonePairs"]: add(t["hz"], t["py"], "tonepair")
    # stroke-order screen speaks each single character of a unit's words
    for w in C["words"]:
        sy = re.findall(r"(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?:ng(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|n(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|r(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))?", w["py"].lower())
        if len(sy) == len(w["hz"]) - 1 and w["hz"].endswith("儿") and w["py"].endswith("r"):   # erhua: 哪儿 nǎr
            sy = [x[:-1] if x.endswith("r") and x not in ("er", "ér", "ěr", "èr") else x for x in sy] + ["ér"]
        if len(sy) == len(w["hz"]):
            for ch, p in zip(w["hz"], sy):
                if ch in seen: continue
                if not re.search("[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", p):
                    # neutral in this word (e.g. 朋友 péngyou): say the character's citation tone instead
                    try:
                        from pypinyin import pinyin as _pp, Style as _S
                        p = _pp(ch, style=_S.TONE)[0][0]
                    except ImportError:
                        pass
                add(ch, p, "char")
    for s in C["sentences"]: add(tok_text(s["tokens"]), tok_py(s["tokens"]), "sentence", s["tokens"])
    for r in C["readings"]:
        add(tok_text(r["tokens"]), tok_py(r["tokens"]), "story", r["tokens"])
        for hz, py in r["tokens"]:
            if py: add(hz, py, "storyword")
    for d in C["dialogues"]:
        for l in d["lines"]:
            add(tok_text(l["tokens"]), tok_py(l["tokens"]), "line", l["tokens"])
            for hz, py in l["tokens"]:
                if py: add(hz, py, "storyword")
    for toks, kind in EXTRA: add(tok_text(toks), tok_py(toks), kind, toks)
    return items

if __name__ == "__main__":
    its = inventory()
    from collections import Counter
    print(len(its), Counter(k for i in its for k in i["kinds"][:1]))
    print("chars total", sum(len(i["text"]) for i in its))
    for i in its:
        if i.get("alt_py"): print("CONFLICT", i["text"], i["py"], i["alt_py"], i["kinds"])
