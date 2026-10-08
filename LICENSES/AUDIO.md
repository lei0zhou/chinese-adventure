# Recorded voice (audio/*.mp3)

All clips in `audio/` were generated offline on our own computer by `tools/build_audio.py`. No cloud
text-to-speech service was used.

| | |
|---|---|
| Model | [Kokoro-82M v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh) by hexgrad |
| Model license | **Apache License 2.0** (full text: `LICENSES/Apache-2.0-Kokoro.txt`) |
| Voice | `zf_021` (one of the model's 100 built-in Mandarin speakers) |
| Training data | Per the model card, the Chinese data was "freely and permissively granted" to the model authors by LongMaoData, a professional dataset company. |
| Front end | [misaki](https://github.com/hexgrad/misaki) (Apache-2.0) tone-sandhi/erhua rules, fed with the app's own pinyin; [pypinyin](https://github.com/mozillazg/python-pinyin) (MIT) |
| Pitch shaping | [Praat](https://www.fon.hum.uva.nl/praat/) via [parselmouth](https://github.com/YannickJadoul/Parselmouth) (GPL-3.0 tool; used only to process audio, not distributed) |
| Encoding | ffmpeg / LAME, MP3 mono 24 kHz 40 kbps |

The Apache-2.0 license covers the model weights. It places no restrictions on audio produced with the model.
To the extent we hold any rights in the generated clips, we dedicate them to the public domain under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Anyone may reuse them for any purpose.
