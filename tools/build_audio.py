#!/usr/bin/env python3
"""Generate the bundled Mandarin recordings in audio/ (offline, open-source TTS).

Engine: Kokoro-82M v1.1-zh (Apache-2.0) via the `kokoro` + `misaki[zh]` Python packages, voice zf_021.
Pinyin-exact: instead of letting the TTS guess readings, every clip is synthesized from the app's own
pinyin (tools/content_src.py -> data/content.js), so polyphones (长/行/了/得/还/觉...) are read as written.
Tone sandhi (3-3, 不, 一) and erhua are then applied by misaki's frontend, as the model was trained.

Single-syllable clips (tone drills, single-character words, stroke-order characters) get one more step:
the TTS realizes isolated tones weakly, so the pitch contour is re-shaped to textbook citation tones
(1 = 55, 2 = 35, 3 = 214, 4 = 51) with Praat PSOLA (parselmouth) and the vowel is lengthened a little.

Setup (Python 3.10-3.12, ffmpeg on PATH):
  pip install "kokoro>=0.9.4" "misaki[zh]>=0.9.4" "transformers>=4.45" soundfile praat-parselmouth pypinyin
Run:
  python3 tools/build_audio.py            # (re)builds missing clips, writes audio/manifest.json
  python3 tools/build_audio.py --force    # rebuild everything
Then: python3 tools/build_sw.py
"""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from audio_inventory import inventory  # noqa: E402

REPO_ID = 'hexgrad/Kokoro-82M-v1.1-zh'
VOICE = 'zf_021'
SR = 24000
BITRATE = '40k'
METHOD = 'k11zh-pinyin-v3'          # bump to force regeneration when the pipeline changes
OUT = os.path.join(ROOT, 'audio')
CACHE = os.environ.get('AUDIO_CACHE', os.path.join(tempfile.gettempdir(), 'pp-audio-cache'))
SENT_END = set('。！？')

# Per-item fixes found by the ASR / listening check: text -> dict(py=..., speed=...)
OVERRIDES = {}

# ---------------- pinyin helpers ----------------
from pypinyin.contrib.tone_convert import to_tone3, to_initials, to_finals_tone3  # noqa: E402
V = 'aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
SYL = re.compile(r"(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[" + V + r"]+(?:ng(?![" + V + r"])|n(?![" + V + r"])|r(?![" + V + r"]))?")

def syllables(py):
    return SYL.findall(py.lower().replace("'", " "))

def tok_chars(hz, py):
    """Align characters with tone3 syllables (handles erhua: 哪儿 nǎr, 一点儿 yìdiǎnr)."""
    sy = syllables(py)
    if len(sy) == len(hz) - 1 and hz.endswith('儿') and py.strip().lower().endswith('r'):
        if sy[-1].endswith('r') and sy[-1] not in ('er', 'ér', 'ěr', 'èr'): sy[-1] = sy[-1][:-1]
        sy = sy + ['ér']
    if len(sy) != len(hz):
        raise ValueError(f'cannot align {hz} / {py} -> {sy}')
    out = []
    for c, s in zip(hz, sy):
        t3 = to_tone3(s.replace('ü', 'v'), neutral_tone_with_five=True, v_to_u=False)
        if not t3[-1].isdigit(): t3 += '5'
        out.append((c, t3))
    return out

class G2P:
    """misaki ZH frontend with the pinyin lookup replaced by the app's own pinyin."""
    def __init__(self):
        from misaki.zh import ZHG2P
        self.ZHG2P = ZHG2P
        self.fe = ZHG2P(version='1.1').frontend
        self.queue = []
        self.fe._get_initials_finals = self._ifs
    def _ifs(self, word):
        ini, fin = [], []
        for ch in word:
            c, t3 = self.queue.pop(0)
            assert c == ch, (c, ch, word)
            i = to_initials(t3, strict=True) or ''
            f = to_finals_tone3(t3, strict=True, neutral_tone_with_five=True)
            if not f[-1].isdigit(): f += '5'
            f = f.replace('ü', 'v')
            if re.match(r'i\d', f):
                if i in ('z', 'c', 's'): f = 'ii' + f[1:]
                elif i in ('zh', 'ch', 'sh', 'r'): f = 'iii' + f[1:]
            ini.append(i); fin.append(f)
        return ini, fin
    def phonemes(self, tokens):
        text = ''.join(t[0] for t in tokens)
        self.queue = [x for hz, py in tokens if py for x in tok_chars(hz, py)]
        ps, _ = self.fe(self.ZHG2P.map_punctuation(text))
        assert not self.queue, ('leftover pinyin', self.queue, text)
        return ps

def chunks(tokens):
    cur, out = [], []
    for t in tokens:
        cur.append(t)
        if not t[1] and t[0] in SENT_END: out.append(cur); cur = []
    if cur: out.append(cur)
    return out

# ---------------- audio helpers ----------------
def trim(a, thr_db=-42, pad=0.06):
    env = np.convolve(np.abs(a), np.ones(240) / 240, mode='same')
    idx = np.where(env > (env.max() or 1) * 10 ** (thr_db / 20))[0]
    if not len(idx): return a
    return a[max(0, idx[0] - int(pad * SR)): min(len(a), idx[-1] + int(pad * SR))]

def fade(a, ms_in=8, ms_out=30):
    a = a.copy(); ni, no = int(SR * ms_in / 1000), int(SR * ms_out / 1000)
    a[:ni] *= np.linspace(0, 1, ni); a[-no:] *= np.linspace(1, 0, no)
    return a

def normalize(a, target_db=-19.0, peak_db=-1.5):
    rms = np.sqrt(np.mean(a ** 2)) or 1e-9
    g = 10 ** (target_db / 20) / rms
    pk = np.abs(a).max() * g
    if pk > 10 ** (peak_db / 20): g *= 10 ** (peak_db / 20) / pk
    return (a * g).astype(np.float32)

LEVEL = {5: 5.0, 4: 2.5, 3: 0.0, 2: -3.0, 1: -6.0}   # semitones vs. the voice's median pitch
CONTOURS = {1: [(0, 5), (1, 4.8)], 2: [(0, 3), (0.2, 2.7), (0.6, 3.9), (1, 5)],
            3: [(0, 2.3), (0.45, 1.1), (0.7, 1.0), (1, 3.6)], 4: [(0, 4.9), (0.12, 5), (1, 1.3)], 5: [(0, 3), (1, 2.2)]}
STRETCH = {1: 1.25, 2: 1.3, 3: 1.45, 4: 1.15, 5: 1.0}
def lv(x):
    lo = max(1, int(np.floor(x))); hi = min(5, lo + 1); f = x - np.floor(x)
    return LEVEL[lo] + (LEVEL[hi] - LEVEL[lo]) * f

def voiced(snd):
    p = snd.to_pitch(time_step=0.005, pitch_floor=75, pitch_ceiling=600)
    f = p.selected_array['frequency']; ts = p.xs(); idx = np.where(f > 0)[0]
    return (ts[idx[0]], ts[idx[-1]], float(np.median(f[idx]))) if len(idx) >= 4 else None

def retone(a, tone, ref_hz):
    import parselmouth
    from parselmouth.praat import call
    snd = parselmouth.Sound(a.astype(np.float64), sampling_frequency=SR)
    vs = voiced(snd)
    if vs is None: return a
    t0, t1, _ = vs
    man = call(snd, 'To Manipulation', 0.005, 75, 600)
    tier = call('Create PitchTier', 'tone', snd.xmin, snd.xmax)
    for u, level in CONTOURS[tone]:
        call(tier, 'Add point', t0 + u * (t1 - t0), ref_hz * 2 ** (lv(level) / 12))
    call([tier, man], 'Replace pitch tier')
    f = STRETCH.get(tone, 1.0)
    if f != 1.0:
        dt = call('Create DurationTier', 'dur', snd.xmin, snd.xmax)
        call(dt, 'Add point', max(snd.xmin, t0 - 0.001), 1.0); call(dt, 'Add point', t0 + 0.02, f)
        call(dt, 'Add point', t1 - 0.02, f); call(dt, 'Add point', min(snd.xmax, t1 + 0.001), 1.0)
        call([dt, man], 'Replace duration tier')
    out = call(man, 'Get resynthesis (overlap-add)')
    return np.asarray(out.values[0], dtype=np.float32)

# ---------------- synthesis ----------------
class Synth:
    def __init__(self):
        import torch
        from kokoro import KModel, KPipeline
        torch.set_num_threads(max(1, (os.cpu_count() or 2) - 1))
        self.torch = torch
        self.model = KModel(repo_id=REPO_ID).eval()
        self.pipe = KPipeline(lang_code='z', repo_id=REPO_ID, model=self.model, en_callable=lambda s: '')
        self.pack = self.pipe.load_voice(VOICE)
        self.g2p = G2P()
        self._ref = None
    def run(self, ps, speed, durs=False):
        with self.torch.no_grad():
            out = self.model(ps, self.pack[len(ps) - 1], speed, return_output=True)
        return (out.audio.numpy(), out.pred_dur.numpy()) if durs else out.audio.numpy()
    @staticmethod
    def speed_for(n, base):
        # Kokoro's own guidance: slow down long inputs to avoid rushing
        s = 1.0 if n <= 83 else (1 - (n - 83) / 500 if n < 183 else 0.8)
        return s * base
    def ref_hz(self):
        if self._ref is None:
            import parselmouth
            vals = []
            for toks in ([['我', 'wǒ'], ['叫', 'jiào'], ['小明', 'Xiǎo Míng'], ['。', '']],
                         [['今天', 'jīntiān'], ['天气', 'tiānqì'], ['很', 'hěn'], ['好', 'hǎo'], ['。', '']],
                         [['我们', 'wǒmen'], ['一起', 'yìqǐ'], ['去', 'qù'], ['动物园', 'dòngwùyuán'], ['吧', 'ba'], ['！', '']]):
                a = self.run(self.g2p.phonemes(toks), 1.0)
                vals.append(voiced(parselmouth.Sound(a.astype(np.float64), SR))[2])
            self._ref = float(np.median(vals))
        return self._ref
    def item(self, it):
        ov = OVERRIDES.get(it['text'], {})
        toks = [tuple(t) for t in it['tokens']]
        if ov.get('py'): toks = [(it['text'], ov['py'])]
        han = [(hz, py) for hz, py in toks if py]
        single = len(han) == 1 and len(han[0][0]) == 1
        if single:
            ps = self.g2p.phonemes(toks)
            a = trim(self.run(ps, ov.get('speed', 1.0)))
            tone = int(tok_chars(*han[0])[0][1][-1])
            a = trim(retone(a, tone, self.ref_hz()), pad=0.04)
            return fade(normalize(a)), ps
        base = ov.get('speed', 0.95 if len(it['text']) <= 4 else 0.92)
        parts, pss = [], []
        for ch in chunks(toks):
            ps = self.g2p.phonemes(ch); pss.append(ps)
            a = trim(self.run(ps, self.speed_for(len(ps), base)), pad=0.04)
            if parts: parts.append(np.zeros(int(SR * 0.38), np.float32))
            parts.append(a)
        return fade(normalize(np.concatenate(parts))), ' | '.join(pss)

def item_key(it):
    return hashlib.sha1(json.dumps([METHOD, VOICE, it['tokens'], OVERRIDES.get(it['text'])], ensure_ascii=False).encode()).hexdigest()

def clip_name(it):
    """Stable id: same text + same synthesis settings -> same file name (so caches can reuse it)."""
    return hashlib.sha1(it['text'].encode('utf-8')).hexdigest()[:8] + '-' + item_key(it)[:6] + '.mp3'

def encode(wav, path):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: tmp = f.name
    sf.write(tmp, wav, SR, subtype='PCM_16')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', BITRATE,
                    '-map_metadata', '-1', '-id3v2_version', '0', '-write_xing', '1', path], check=True)
    os.unlink(tmp)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--force', action='store_true'); ap.add_argument('--only', nargs='*')
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
    items = inventory()
    synth = None
    clips, meta = {}, {}
    for k, it in enumerate(items):
        name = clip_name(it); path = os.path.join(OUT, name)
        fresh = os.path.exists(path) and os.path.exists(os.path.join(CACHE, name[:-4] + '.wav'))
        if args.force or (args.only is not None and it['text'] in args.only) or not fresh:
            synth = synth or Synth()
            wav, ps = synth.item(it)
            sf.write(os.path.join(CACHE, name[:-4] + '.wav'), wav, SR)
            encode(wav, path)
            print(f'[{k + 1}/{len(items)}] {it["text"][:24]} -> {name} ({len(wav) / SR:.2f}s) {ps[:60]}', flush=True)
        clips[it['text']] = name
        meta[name] = {'text': it['text'], 'py': it['py'], 'kinds': it['kinds']}
    # silent clip used to unlock audio on iOS
    sil = os.path.join(OUT, 'silence.mp3')
    if not os.path.exists(sil): encode(np.zeros(int(SR * 0.12), np.float32), sil)
    keep = set(clips.values()) | {'silence.mp3', 'manifest.json'}
    for fn in os.listdir(OUT):
        if fn not in keep: os.unlink(os.path.join(OUT, fn)); print('removed stale', fn)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in set(clips.values()))
    man = {'version': 1, 'engine': 'Kokoro-82M v1.1-zh (Apache-2.0), voice ' + VOICE, 'voice': VOICE, 'method': METHOD,
           'format': 'audio/mpeg', 'sampleRate': SR, 'bitrate': BITRATE, 'count': len(clips), 'bytes': total,
           'license': 'Kokoro-82M-v1.1-zh model: Apache-2.0. Generated clips: CC0-1.0 (see LICENSES/AUDIO.md)', 'clips': clips}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(meta, open(os.path.join(CACHE, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'{len(clips)} clips, {total / 1048576:.2f} MB')

if __name__ == '__main__':
    main()
