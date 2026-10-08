#!/usr/bin/env python3
"""Validate tools/content_src.py and write data/content.js (+ tools/charset.txt).

Usage: python3 tools/build.py          (needs: pip install pypinyin)
Then:  node tools/build_strokes.mjs    (bundles hanzi-writer stroke data for every character)
       python3 tools/build_font.py     (subsets Noto Sans SC to the characters used)
"""
import json, os, re, sys, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
import content_src as C

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUNCT = set("。！？，、：“”；…—")
TONE_MARKS = {"ā":1,"á":2,"ǎ":3,"à":4,"ē":1,"é":2,"ě":3,"è":4,"ī":1,"í":2,"ǐ":3,"ì":4,
              "ō":1,"ó":2,"ǒ":3,"ò":4,"ū":1,"ú":2,"ǔ":3,"ù":4,"ǖ":1,"ǘ":2,"ǚ":3,"ǜ":4}
errors, notes = [], []

def is_han(ch): return '\u4e00' <= ch <= '\u9fff'

def syllables(py):
    """Split a pinyin word into syllables (best effort, for counting vs. characters)."""
    py = py.lower().replace("'", " ").replace("_", " ")
    out = []
    for w in py.split():
        # er-hua: trailing r after a vowel on a multi-char word (nǎr, yìdiǎnr) counts as 儿
        out += re.findall(r"(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?:ng|n(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])|r(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))?", w)
    return out

def tone_of(syl):
    for ch in syl:
        if ch in TONE_MARKS: return TONE_MARKS[ch]
    return 0

def parse_tokens(s, where):
    toks = []
    for t in s.split():
        if t in PUNCT:
            toks.append([t, ""]); continue
        if "/" not in t:
            errors.append(f"{where}: token without pinyin: {t}"); continue
        hz, py = t.split("/", 1)
        py = py.replace("_", " ")
        if not all(is_han(c) for c in hz):
            errors.append(f"{where}: non-Han in token {t}")
        toks.append([hz, py])
    return toks

try:
    from pypinyin import pinyin, Style
except ImportError:
    pinyin = None
    notes.append("pypinyin not installed: skipped pinyin cross-check")

def norm(p): return re.sub(r"[\s'_]", "", p.lower())
diffs = []
def check_py(hz, py, where):
    n_syl = len(syllables(py))
    erhua = len(hz) > 1 and hz.endswith("儿") and py.endswith("r")
    if not (n_syl == len(hz) or (erhua and n_syl == len(hz) - 1)):
        errors.append(f"{where}: {hz} has {len(hz)} chars but pinyin '{py}' parses to {n_syl} syllables")
    if pinyin:
        ref = "".join(x[0] for x in pinyin(hz, style=Style.TONE))
        if norm(ref) != norm(py):
            diffs.append(f"{hz}\t{py}\t(pypinyin: {ref})\t{where}")

units, all_words, seen = [], [], {}
assert sorted(C.UNIT_ORDER) == sorted(u['id'] for u in C.UNITS)
for u in sorted(C.UNITS, key=lambda u: C.UNIT_ORDER.index(u['id'])):
    words = []
    for line in u["words"].strip().splitlines():
        parts = line.split("|")
        if len(parts) != 4: errors.append(f"bad word line: {line}"); continue
        hz, py, en, emo = parts
        if hz in seen: errors.append(f"duplicate word {hz} in {u['id']} and {seen[hz]}")
        seen[hz] = u["id"]
        check_py(hz, py, u["id"])
        w = dict(id=f"{u['id']}:{hz}", hz=hz, py=py, en=en, emoji=emo, unit=u["id"])
        words.append(w); all_words.append(w)
    city = dict(u["city"])
    check_py(city["hz"], city["py"], "city")
    units.append(dict(id=u["id"], en=u["en"], zh=u["zh"], py=u["py"], emoji=u["emoji"], color=u["color"],
                      city=city, words=[w["id"] for w in words]))
unit_ids = {u["id"] for u in units}

def tokens_check(toks, where):
    for hz, py in toks:
        if py: check_py(hz, py, where)

sentences = []
for i, s in enumerate(C.SENTENCES):
    unit, text, en = s[:3]
    alts = s[3] if len(s) > 3 else []
    if unit not in unit_ids: errors.append(f"sentence {i}: bad unit {unit}")
    toks = parse_tokens(text, f"sentence {i}")
    tokens_check(toks, f"sentence {i}")
    words = [t for t in toks if t[1]]
    end = "".join(t[0] for t in toks if not t[1])
    if len(end) != 1 or toks[-1][1]: errors.append(f"sentence {i}: needs exactly one final punctuation mark")
    for a in alts:
        if sorted(a) != sorted("".join(t[0] for t in words)): errors.append(f"sentence {i}: alt '{a}' uses different characters")
    sentences.append(dict(unit=unit, tokens=words, end=end, en=en, alts=alts))

readings = []
for r in C.READINGS:
    if r["unit"] not in unit_ids: errors.append(f"reading {r['title']}: bad unit")
    toks = parse_tokens(r["text"], r["title"])
    tokens_check(toks, r["title"])
    check_py(r["title"], r["py"].replace(" ", ""), r["title"] + " (title)")
    qs = []
    for q, opts in r["qs"]:
        if len(opts) != 3 or len(set(opts)) != 3: errors.append(f"reading {r['title']}: options must be 3 distinct")
        qs.append(dict(q=q, answer=opts[0], options=opts))
    readings.append(dict(unit=r["unit"], title=r["title"], py=r["py"], en=r["en"], tokens=toks, trans=r["trans"], qs=qs))

dialogues = []
for d in C.DIALOGUES:
    if d["unit"] not in unit_ids: errors.append(f"dialogue {d['id']}: bad unit")
    lines = []
    for j, (who, text, en, tip) in enumerate(d["lines"]):
        toks = parse_tokens(text, f"dialogue {d['id']}:{j}")
        tokens_check(toks, f"dialogue {d['id']}")
        lines.append(dict(who=who, tokens=toks, en=en, tip=tip))
    whos = [l["who"] for l in lines]
    if any(a == b for a, b in zip(whos, whos[1:])): errors.append(f"dialogue {d['id']}: speakers must alternate")
    dialogues.append(dict(id=d["id"], unit=d["unit"], title=d["title"], py=d["py"], en=d["en"], emoji=d["emoji"],
                          roles=d["roles"], setting=d["setting"], lines=lines))

vocab = {w["hz"] for w in all_words}
gloss_needed = set()
for s_ in sentences: gloss_needed |= {t[0] for t in s_["tokens"]}
for r in readings: gloss_needed |= {t[0] for t in r["tokens"] if t[1]}
for d in dialogues:
    for l in d["lines"]: gloss_needed |= {t[0] for t in l["tokens"] if t[1]}
for hz in sorted(gloss_needed - vocab):
    if hz not in C.GLOSS: errors.append(f"missing GLOSS for {hz}")
for hz in C.GLOSS:
    if hz not in gloss_needed: notes.append(f"unused GLOSS entry {hz}")
    if hz in vocab: errors.append(f"GLOSS entry {hz} duplicates vocab")

# Tone items: single-character words with a marked tone.
tone_items = [dict(hz=w["hz"], py=w["py"], en=w["en"], tone=tone_of(w["py"]), id=w["id"])
              for w in all_words if len(w["hz"]) == 1 and tone_of(w["py"])]
# Tone pairs: 2-char words, both syllables parsed, skipping 3+3 (written tones differ from spoken)
tone_pairs = []
for w in all_words:
    sy = syllables(w["py"])
    if len(w["hz"]) == 2 and len(sy) == 2:
        t = [tone_of(x) for x in sy]
        if t == [3, 3] or t[0] == 0: continue
        tone_pairs.append(dict(hz=w["hz"], py=w["py"], en=w["en"], tones=t, sylls=sy, id=w["id"]))

out = dict(gloss=C.GLOSS, units=units, words=all_words, sentences=sentences, readings=readings, dialogues=dialogues,
           toneItems=tone_items, tonePairs=tone_pairs,
           toneDemo=[dict(hz=a, py=b, en=c) for a, b, c in C.TONE_DEMO])

chars = set()
def add(s): chars.update(c for c in s if is_han(c))
for w in all_words: add(w["hz"])
for u in units: add(u["zh"]); add(u["city"]["hz"]); add(u["city"]["fact"])
for s in sentences: add("".join(t[0] for t in s["tokens"]))
for r in readings: add(r["title"]); add("".join(t[0] for t in r["tokens"])); [add(" ".join(q["options"])) for q in r["qs"]]
for d in dialogues: add(d["title"]); [add("".join(t[0] for t in l["tokens"])) for l in d["lines"]]
for t in C.TONE_DEMO: add(t[0])
UI_CHARS = "熊猫护照中文学习每日复习闪卡声调配对写字句子阅读角色扮演地图城市徽章家长设置开始完成答对错再来一次星好棒加油真厉害太了听说读写"
add(UI_CHARS)

print(f"units={len(units)} words={len(all_words)} sentences={len(sentences)} readings={len(readings)} "
      f"dialogues={len(dialogues)} toneItems={len(tone_items)} tonePairs={len(tone_pairs)} chars={len(chars)}")
if diffs:
    print(f"\n{len(diffs)} pinyin differences vs pypinyin (review: neutral tones / 一不 sandhi / names are expected):")
    for d in sorted(set(diffs)): print("  " + d)
for n in notes: print("NOTE:", n)
if errors:
    print("\nERRORS:"); [print("  " + e) for e in errors]; sys.exit(1)

with open(os.path.join(ROOT, "data", "content.js"), "w", encoding="utf-8") as f:
    f.write("/* Generated by tools/build.py from tools/content_src.py. Do not edit by hand. */\n")
    f.write("window.CONTENT = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
with open(os.path.join(ROOT, "tools", "charset.txt"), "w", encoding="utf-8") as f:
    f.write("".join(sorted(chars)))
print("wrote data/content.js and tools/charset.txt")
