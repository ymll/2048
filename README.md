# CUHK 2048

**[Play it live → ymll.github.io/2048](https://ymll.github.io/2048/)**

加油砌到中大！A CUHK twist on the classic 2048 puzzle: instead of numbers, the tiles are
CUHK colleges. Start at 和聲 and merge your way up — through 伍宜孫, 敬文, 善衡, 晨興,
逸夫, 聯合, 新亞 and 崇基 — to reach 中大, then keep going to the final tile, 爆四.

## How to play

Use the **arrow keys** to slide the tiles (swipe on touch screens). When two tiles with the
same college touch, they **merge** into the next college up. A new tile appears after every
move — plan ahead, and don't let the board fill up.

There are **two stages to win**, not one:

1. **2048 — 中大**: reach the CUHK tile and the game pauses with “中大歡迎你！”
   (Welcome to CUHK!). You can keep playing from there.
2. **8192 — 爆四**: reach the final tile for the full win, “成功爆四！”
   (Exceed 4 — you did it!). The game ends here — there is no tile past 爆四.

## The college ladder

| Tile | 中文 | English |
| --- | --- | --- |
| 2 | 和聲 | WS |
| 4 | 伍宜孫 | WYS |
| 8 | 敬文 | CWC |
| 16 | 善衡 | SHHO |
| 32 | 晨興 | MC |
| 64 | 逸夫 | Shaw |
| 128 | 聯合 | UC |
| 256 | 新亞 | NA |
| 512 | 崇基 | CC |
| 1024 | 走讀 | Day Student |
| 2048 | 中大 | CUHK |
| 4096 | 過三 | Pass 3 |
| 8192 | 爆四 | Exceed 4 |

## Features

- **中文 / English** — switch language from the top right; your choice is remembered.
- **Share screenshot** — share a 1080×1080 image of your board and score, made for
  Instagram and Threads.
- **Auto-save** — your game is saved in the browser, so you can close the tab and
  pick up where you left off. Your best score is saved too.
- **Installable (PWA)** — add it to your home screen and play offline after the
  first visit.
- **FAQ** — tap the “?” for the rules and the full college ladder (the tiles are
  supposed to be a surprise, so it's tucked away).
- **The 和聲 chant** — lose, and the game-over screen chants for you in Cantonese,
  based on how far you got.

## Run it locally

It's a static site — no build step, no dependencies. Serve the folder over HTTP
(the service worker needs a real origin; `file://` won't do):

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Credits

Based on [2048 by Gabriele Cirulli](https://github.com/gabrielecirulli/2048),
reworked for CUHK by [Lily Yung](https://ymll.github.io/).

Found a bug or have an idea? Open an issue:
[github.com/ymll/2048/issues](https://github.com/ymll/2048/issues)
