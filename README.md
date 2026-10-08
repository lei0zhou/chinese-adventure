# 🐼 Panda Passport · 熊猫护照

A free, **offline-first Mandarin Chinese learning app for kids around 8–11**, built as a plain static website for **GitHub Pages**. Kids travel around a map of China. Each of the 12 cities is a themed unit, and passing its 🏆 City Challenge earns a passport stamp and unlocks the next stop.

- **Pure static site.** HTML, CSS and JS with no build step, no framework, no CDN, no trackers and no accounts.
- **Real Mandarin audio, built in.** Every word, sentence, story and role-play line has a pre-recorded clip (open-source voice, ~3 MB total), so it talks on any device, even ones with no Chinese voice installed.
- **Works offline.** After the first visit, a service worker caches everything, recordings included. It's installable as a PWA ("Add to Home Screen").
- **Private by design.** Progress lives in `localStorage` on the device. Microphone recordings stay in memory, or optionally in IndexedDB on the device, and are never uploaded. A strict Content-Security-Policy blocks all outside connections.
- **Tablet friendly.** Big touch targets, tap or drag, portrait or landscape.

## What's inside

**211 words** (about HSK 1–2) in **12 units**. The journey is a loop around China that starts in Beijing:

| # | City | Unit | Words |
|---|------|------|------:|
| 1 | 北京 Beijing | Hello! 你好 (greetings, pronouns, polite words) | 19 |
| 2 | 西安 Xi'an | Numbers & Time 数字和时间 | 23 |
| 3 | 成都 Chengdu | Animals 动物 | 17 |
| 4 | 拉萨 Lhasa | Family 家人 | 19 |
| 5 | 桂林 Guilin | Colors 颜色 | 16 |
| 6 | 广州 Guangzhou | Food & Drinks 吃的和喝的 | 19 |
| 7 | 香港 Hong Kong | Places & Directions 地方和方向 | 18 |
| 8 | 杭州 Hangzhou | Body & Health 身体 | 15 |
| 9 | 上海 Shanghai | Feelings 心情 | 16 |
| 10 | 南京 Nanjing | School 学校 | 18 |
| 11 | 青岛 Qingdao | Hobbies & Sports 爱好 | 16 |
| 12 | 哈尔滨 Harbin | Weather & Seasons 天气 | 15 |

**Activities in every unit:**

| | Activity | What it does |
|---|---|---|
| 🃏 | Flashcards | Flip cards, choosing 汉字, pinyin or English on the front. "I know it" and "Still learning" feed the review schedule. |
| 🎵 | Tone Trainer / Tone Gym | Pick the tone of one syllable, or both tones of a two-syllable word (neutral tone included). You **hear** it (recorded voice), then pick the tone. Tone contour pictures and a 妈麻马骂 demo help. |
| 🧩 | Matching | Pair 6 characters with English or with pinyin, against a timer and a mistake counter. |
| 🖌️ | Stroke Order | Uses [Hanzi Writer](https://hanziwriter.org): watch the animation, trace it, then write from memory with hints. Stroke data for all 253 characters ships with the app. |
| 🧱 | Sentence Builder | Drag or tap word tiles (with pinyin) to build 44 sentences. Valid alternative word orders are accepted. |
| 📖 | Story Time | 12 short graded stories with pinyin you can toggle (ruby), tap-a-word glosses, an English translation and 3 comprehension questions each. |
| 🎭 | Role-Play Theater | 7 scripted scenes: new friend, restaurant, fruit-market bargaining, zoo, doctor, asking directions, birthday party. Pick a part and the app reads the other part. Each of your lines has an acting tip. **Record yourself** (on-device only), play your take, then play the whole scene with your own voice. Swap parts, or draw a random "acting twist" card. |
| 🏆 | City Challenge | 8 mixed questions. Score 6 or more to earn the stamp and unlock the next city. |
| 📅 | Daily Mix | Spaced repetition in Leitner boxes with intervals of 0/1/2/4/8/16/32 days. Due words come first, then a few new words. Missed words come back sooner. |

**Rewards:** stars (1–3 per activity), a day streak, a passport with 12 city stamps, 17 badges, and a fun fact for each city.
**Grown-ups area** (behind a times-table gate): per-unit progress, settings (sound, tone colors, unlock all cities, keep recordings), **Voice** settings per explorer (recorded / device / auto, normal or slow speed), **export and import of progress JSON**, reset, delete explorer, and delete saved recordings. Up to 4 explorer profiles share one device.

### Accuracy notes
- Content is written by hand. It uses Simplified characters and pinyin with tone marks.
- `tools/build.py` cross-checks every word against `pypinyin` and checks syllable counts. All remaining differences have been reviewed. They are expected textbook conventions:
  - neutral tones (xièxie, bàba, péngyou),
  - spoken 一/不 tone changes (yìqǐ, yí ge, bú kèqi),
  - correct readings where pypinyin guesses wrong (只 zhī as a counter, 肚子 dùzi, 弹钢琴 tán, 教 jiāo).
- Third-tone sandhi (nǐ hǎo is said ní hǎo) is not written, following standard practice.

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to the `main` branch. The site lives at the repository root.
2. On GitHub, open **Settings › Pages**.
3. Under **Build and deployment › Source**, choose **Deploy from a branch**. Set the branch to **`main`** and the folder to **`/ (root)`**, then click **Save**.
4. Wait a minute. The site appears at `https://<your-user>.github.io/<repo>/`.

All paths are relative, so the app works under any `/<repo>/` subpath. `.nojekyll` turns off Jekyll processing.

With the GitHub CLI instead:
```bash
gh repo create <repo> --public --source . --push
gh api -X POST repos/<user>/<repo>/pages -f 'source[branch]=main' -f 'source[path]=/'
```

## Run locally
```bash
python3 -m http.server 8000     # then open http://localhost:8000
```
The service worker needs `http://localhost` or HTTPS. GitHub Pages is HTTPS, so the microphone and offline mode both work there.

## Audio and voices
The app ships **pre-generated Mandarin recordings** in `audio/` (MP3, mono, 40 kbps; `audio/manifest.json` maps each Chinese string to its clip). They play on every browser, including iPad Safari, and the service worker caches them for offline use.

**Voice setting** (👪 Grown-ups › Voice, or the 🔊 button in the top bar; saved per explorer):

| Mode | What it does |
|---|---|
| **Recorded voice** (default) | Plays the bundled clips. |
| **Device voice** | Uses the device's own Chinese text-to-speech voice (pick one if there are several). If the device has none, a note says so and the recordings are used instead. |
| **Auto** | Recordings first; the device voice fills in if a clip is missing or can't play. |

Speed: **🐇 Normal** or **🐢 Slow** (slow plays clips at 0.7× with pitch preserved). The "Device voice speed" slider tunes the device voice only.

**How the clips were made** (`tools/build_audio.py`, fully offline): [Kokoro-82M v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh) (Apache-2.0), voice `zf_021`. Instead of letting the TTS guess readings, each clip is synthesized from the app's own pinyin, so polyphones (长, 行, 了, 得, 还, 觉 …) are read as written, with 3rd-tone, 不 and 一 sandhi applied. Kokoro renders isolated syllables with weak tones, so single-syllable clips (tone drills, one-character words, stroke-order characters) have their pitch re-shaped to textbook citation tones (1 = high level, 2 = rising, 3 = low dipping, 4 = falling) with Praat. Every clip was checked with two offline speech recognizers (Paraformer and SenseVoice); see `LICENSES/AUDIO.md` for licenses.

If a Chinese device voice is wanted for "Device voice":

| Device | Chinese voice |
|---|---|
| iPad / iPhone | Usually has one (Tingting). Better voices: Settings › Accessibility › Spoken Content › Voices › Chinese. |
| Android | Chrome with Google TTS works well. Install Chinese in Settings › Text-to-speech. |
| Windows | Settings › Time & Language › Speech › Add voices › Chinese (Simplified). |
| Mac | System Settings › Accessibility › Spoken Content › System voice › Manage Voices › Chinese. |

If neither recordings nor a device voice are available, every activity still works in a pinyin-only mode and a banner explains this.

## Rebuilding content (optional; the built files are committed)
```bash
pip install pypinyin fonttools brotli
npm i hanzi-writer-data@2.0.1 world-atlas d3-geo topojson-client   # in any folder; point NODE_PATH at its node_modules
python3 tools/build.py                    # validate content -> data/content.js, tools/charset.txt
NODE_PATH=... node tools/build_strokes.mjs   # stroke data for the vocabulary -> data/strokes.js
NODE_PATH=... node tools/build_map.mjs       # map outline + city positions -> data/map.js
python3 tools/build_font.py NotoSansSC-Regular.ttf NotoSansSC-Bold.ttf   # subset fonts -> fonts/*.woff2
python3 tools/build_audio.py              # Mandarin clips -> audio/*.mp3 + audio/manifest.json (needs kokoro, misaki[zh], praat-parselmouth, ffmpeg; see the script header)
python3 tools/build_sw.py                 # refresh the service-worker precache list + version
node tools/verify.mjs http://127.0.0.1:8000/         # headless-Chrome end-to-end check (puppeteer-core; run from a folder where it is installed)
node tools/verify_audio.mjs http://127.0.0.1:8000/   # audio: every clip 200 + audio/mpeg, coverage, speak buttons play, voice settings
```
Edit content in `tools/content_src.py`.

## Folder layout
```
index.html  manifest.webmanifest  sw.js  .nojekyll
css/app.css
js/core.js         state, storage, spaced repetition, rewards, speech, recorder
js/activities.js   flashcards, tones, matching, stroke order, sentence builder, stories, role-play, challenge, daily mix
js/views.js        map home, unit pages, theater, passport, profiles, grown-ups, router
data/content.js    generated content    data/strokes.js  stroke data    data/map.js  map outline
audio/             recorded Mandarin clips (*.mp3) + manifest.json
vendor/            hanzi-writer + licenses
fonts/             Noto Sans SC subset (woff2) + OFL
assets/icons/      PWA icons
tools/             content source, build and verify scripts (not needed to serve the site)
```

## Credits and licenses
- App code and all lessons, stories, dialogues and city facts: original, MIT license (see `LICENSE`).
- [Hanzi Writer](https://github.com/chanind/hanzi-writer) v3.7.3 by David Chanin: MIT (`vendor/hanzi-writer.LICENSE`).
- Stroke data: [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) 2.0.1, derived from [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), which is based on fonts by Arphic Technology. It's under the **Arphic Public License** (`vendor/hanzi-writer-data.ARPHICPL.TXT`), and only the 253 characters used are bundled.
- Font: Noto Sans SC (subset), SIL Open Font License 1.1 (`fonts/OFL.txt`).
- Map: land outline from [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) (public domain). It's a simple stylized land map with no political borders. A few close cities are nudged a few pixels apart so they stay tappable.
- Recorded voice: generated with [Kokoro-82M v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh), Apache-2.0 (`LICENSES/Apache-2.0-Kokoro.txt`). The generated clips are dedicated to the public domain (CC0). Details in `LICENSES/AUDIO.md`.
- Emoji are drawn by the device's own emoji font.
