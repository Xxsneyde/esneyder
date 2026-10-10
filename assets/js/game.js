'use strict';
/* ═══════════ Navecita: the spaceship game from the old Nokia phones (Space Impact style) ═══════════
   A 168×96 one-colour LCD, drawn pixel by pixel on a canvas and scaled up by CSS.
   Levels made of enemy waves and a boss, power-ups, high score, beeps and a phone-style keypad.
   The loop only runs while the game is on screen; it pauses itself when you scroll away. */
const Game = (() => {
  const W = 168, H = 96, TOP = 9, STEP = 1000 / 60;
  const canvas = $('#gameCanvas'), ctx = canvas.getContext('2d');
  const screen = $('#gameScreen'), wrap = $('#sec-navecita');

  /* ── LCD looks ── */
  const LOOKS = {
    verde: { name: 'Verde clásico', bg: '#C7F0D8', fg: '#43523D' },
    bn: { name: 'Blanco y negro', bg: '#E8E8EA', fg: '#0B0B0D' },
    negativo: { name: 'Negativo', bg: '#0B0B0D', fg: '#E8E8EA' }
  };
  let look = LOOKS[store.getRaw('mybt-navecita-lcd')] ? store.getRaw('mybt-navecita-lcd') : 'verde';
  let BG = LOOKS[look].bg, FG = LOOKS[look].fg;

  /* ── 1-bit art: title and game-over screens (dithered from the chapter images) ── */
  const ART = {
    title: 'f9Sv//8AJiAA/xAATsL3//99AAB/nskX///AByAC3YAAL2tf/2rAqpL/X+RC///pJxQAf0gEE73//vsqEAA/r3Kaq//4ExAA74AQCf/+96SBQhJ/d7gkv//+AZQAP2QABf732qoEABB/j+0SS///icgAV6IAF////VEAABA/Y/yJVX//oMUAO9AAX/vf0ooAICRfL+5lKv//0EQAH9EBdv//SlAgBTDPtf+Sra//6GIADeiFv+/6qUqAIGlvnv/0Vrb/+mEAT+QK/f/9JKQAZWnP3///q2//9DEAB3RXd7/NUkohf////////bX//hEAB/I1//rrKpQv/////////96/9ziAg7ltf+41xUb//////////+v7+5xAAf21/3VadF////////////1d/YxAAdjWv6kml//////////////9VtYgAP7K9ISTV/////////////1eqUoQgF1q0lKpf//////////////3VUcAADclCSpVf////////3////+/qqWIAD+1UkUl/////3///f/n///rqlOIAA+VBJFV7////n//9v/////96SnAAArUqEyr///5///3qf/////7aqSkAAfKAqKf///7P//7o//////+9VGxAAHpVBVe//f+D//7A/+H////epSQAAGwEqR7/8v8D//9B/yD///9XapogAD6oRL3/y/4D//4F/4C////roSsAAB4Ckuv/qf4D//+L/8Af///1WoiQAA9SKrf+S/8H//9r/cH///+61EpAAAOIhW/9K/8f//+T9rX//7/dYiREAAHEU6/6p/////+L+1///9/WuUEgABDilV/pB////X+B7r///9/vRAISAAAwRr/kh////62Lu1///6f1qqCAgAAalX+UB6t//LuDxD///9vuqQJIAAAITP9QB/7//dWBi5///4rzUEgkgAAOkr6IA///+K6Byl///4v+oAAQIAACKXxQB6t//buB6U/834TzUAgCAABTq3qAA/u//q8Brqf7e4K9EAAYgAAIxPRAA/Vf9qsA+kLVvQK6iAACCACgpfKAA4qvya0A7YVWywF8qAAAQAAKMeoAAclUrvcA9iSVdgFdRAABEAFAi+kAAcqqpVoAfpKqvAE8EgAAgAAER+SAAKraVVYAPU4VVACuRAAASAEBB2oAAOuqK1wAPqVK2AA+EAAAJAAFDmAAAFWVCqgAH1ylcAEfBAAACQICHWoAADtqqVAAD66XoABbEgAABAAEFCgAABqkBWAIA3euwABZggAAAkAEMiUAAA9aqqAwAf9rAAEwiAAAAKAENSgAAAaqV0CIAP/8AABwhAAAABAKPKQAAAHVWgAmAA9AAADgxAAAABAIN78AAAB+rAB5AAAAAAFJigAAAAgKAdSgAAALUAH+wAAAAB/TCAAAAAYIAAABAAAAAAf/FAACVIA8DAAAAAEEAAAAEAAAAB/38q/oAAAABAAAAABIAAAA5qAAAH/J/qARQAAACAAAAAAkAAAAFwqAqn+kd//6ABIACAAAAAAEAAAABehuo/v1SaxAqSAAEAAAAAAIAAApBD/m3+j110koAAAFAAAAAAACIAAAUSv//up6USIABIAAEAAAAAQAAAAFBFO13mmZBAigAgAQAAAAAAAABAAAIQCKhSoUoCAAEAAAAAAAAAEAAAAAFFVRqrVOAoAAQABAAAAAAAAAEAAAAQEIlKoDAAAAAAAAAAAAAAAAAQAABFRFSqiDgQAAAAEAAAAAAAAAAAAAAAKVVUQAwAAAAAAAAAAAAAAAAEAAAAAAABAAYAAAAAAAAAAAAAAAAAAAAAAAgABAIAAAAAAcAAAAAAAAAAAAAAAABIAAGAAAAAAYAAAAAAAAAAAAAAAAEABABAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAACACAAQAAAAAAAAAAAAAAAAAAAAAAAACAAEAAAAAAAAEAAAAAAAAAAAAAAADQgAAAAAAAABMAAAAAAAAAAAAAAAFAABAAAAAAAAAAAAAAAAAAAAAAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAFBAAAAAAAAAAAAAAAAAAAAAAAAAAECAAAAAAAAAAAAAAAAAAAAAAAAAAMAoAAAAAAAAAAAAAAAAAAAAAAAAAKAFAAMAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAQAAQAAAgAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAACAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAABAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAoAAAAAAAAAACgAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAACABAAAAAAAAACIAAAAAAAAAAAAAAAECAAAAAAAAAAgAAAAAAAAAAAAAAIAEAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAABAAAAAAAAAAAAAAAgAQAAAAAAAAAAQAAAAAAAAAAAAAAAAgAAAAAAAAACAAAAAAAAAAAAAAAABA',
    over: '//////////////////r//wD///////3//////////////+n//gH/////////////////9/////Du/AD/7///////////+//+v/////X3/AP/////////////+//+f//////7fh/////////////////7///////3//////////////////////////f7//////4///v//////////////9/7//3///kf////////////9//////+//////wP///////v///////2/9////////gf//////v/////9//r/7/+//////gv////////rf//37/K/p//f7////o//////9//l///3/+l98//v/////1/////////C///r/+h/4v73////////f///f/+R/7/r/9n/43/f///////8///////Y///X//v9wf/9/////n/8f//9///5///f//f36v///////3/////////x//+v/7/9oZ/r///////////////j//+//+/vxS77//z//+/////7/+////9v///94Yf4/////////9/v/xe///97/9/pgyn+P////////////or////f/t+9okJ////////z//d//gXff/+3/7/7koj9/////////9v//BJ+//5f/7/WjCJ//f//////////+oF9//1//n73oQj/rXf/////////+gDv//Tfe3/3GEL/9P///////7//9AFf/+N+/vtnIivx1t/P/////v//8AC/v9X8/v9eQBfVe7vv/////f//6AC+f4v5ff9OgL+SK//f9///////8AD9/zfy+/2uIH9JW7vf////////1AF5/N/l9/6UgPxVa/2v////////8ALn/y+T9+cqA/KH///f//7/////+gPX+N+r5+40T9V///7////f////6C2v6rpLz/wgN6v///ff///3/////0//plqXn/Ahfr////7///vjv////b//WWQnn+Jp/Xf37/f////H//////7/4ZFfP9Fn8//wvX7////j///7/////yReb4h9j//0X/d////D///9/////kE8vyruf8/xO3X////Hf//7/////+h6fgDxf/9iv/a///3///////////1y/I3K///wf1T//////////+/8737p8CWD3vyi8/zf/////////6/2/8uJ5IOV3/tgv93////+///+v////7OrwAcLqxHB5b3////5f7/7+7v/vu5TkRZWhtSC993v///8/3//f/Xv9tknhAYSA1WD07///////v/+3+m0rHSPAEiuke4Phzrv+///+///e9XsSLaeIRYCABALS13///+78//+L+T4qBkkCDBK0AB5B3v//++//+/v9/Q/4kqsgMUKLUWolrv///////8vrvqOiBVYJZRAgqrEDr///////+pXv36gAoiiAyAAECQirrf7//9//wAf+q9JWSKolgqARSEQDlf//////oDv9b/1RIkkGVAECAhFXFf7/9///AB/2tKdUiJJVAqBIUAQWBf/v+/1+gD/61VUiIVSISAECCBFGV/3////+AB/VVVVUhREyCQAooAQmE/l/3//+gD/2qqpJJESEUEpCBFCNT93/v/8eAD/qqqSQjSpQEgAIQARLq////38egF/6qlIlOEKFICSBAJEfL/7/////AL/tVUkSIlQgUgAQRAQfV/////7/Vf/7VSSk0UlKQIQCARE9L9////7/+v/6qVUSJEIQSAEAgEQ9X///////7D/9qpJJSSilQgRABAR6X////f///n/eqUlRIYQAgAAFASj4r///////f7/9qlSCSCKqCAQACBH0P+//+//////+1UpVAxBFAgEkAVPoX/////+3///+qqEpSIqSUAgABCfSf/////////926SyKBFBIBAEkEMfh//////+/////tVJUpQUVUAQAAo+H//////7/v///1Uk0EFCoggBISR8Pf///////9///eqqpVQpVKIkAAj54//////////3bqlTSQEFQQgARLV1D////////////t1KkkipKkERAKBoF////////////qW9SSJFUShAEprAr/7////9////7yVKpBSVSgUIhSSQH/7////////+/n95EsAqqVBCEMECL///f////7/7/9mkqRKSUiEQCQagf///v/////////xSREhVSRRAphIIu///b///////7/9JKSKiUIEECIQjv//////P/////ftFBIAVIlRBMBiM///////P///3v9yoKSRAlAIQQhEp//++/+vH//+///6UBBAVQVCEgKCj9/+9//3H/f3///0UEkFCFAgACCSf//+//9fH////+7+KqIQQoSJIAIIf7f/3//vP9//+7/blBiEEREABBIF/v/////7P///////yuRRREokgQQC96v///f/f7////3+5UqEEBAAEEgV6Pr/f//ff//33///9qAhAkEiBAgL9FV/////////3dV3d1VIqAQIQRBTcfqv/9////////3//cogARBKrEJH//V///6//b/f///9/jEAlUF/6BCv//r//v//+3////////igb/W1ISE93b//f////////f/r3/MCtt/+yAq/////////////d9r/f/HQlf7CooF73/////vd/3///v/v/bpKS0stADz9v9//++f/'
  };
  const unpack = b64 => { const s = atob(b64), out = new Uint8Array(W * H); for (let i = 0; i < s.length; i++) { const v = s.charCodeAt(i); for (let k = 0; k < 8; k++) out[i * 8 + k] = (v >> (7 - k)) & 1; } return out; };
  const BITMAPS = { title: unpack(ART.title), over: unpack(ART.over) };
  const artCache = {};
  /** Renders a bitmap once per LCD look into an offscreen canvas, then it is a single drawImage. */
  function art(name) {
    const key = name + look;
    if (artCache[key]) return artCache[key];
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), bits = BITMAPS[name];
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const fg = hex(FG), bg = hex(BG);
    for (let i = 0; i < W * H; i++) { const c3 = bits[i] ? fg : bg; img.data.set([c3[0], c3[1], c3[2], 255], i * 4); }
    g.putImageData(img, 0, 0);
    return (artCache[key] = c);
  }

  /* ── Sprites ('#' = lit pixel) ── */
  const sp = rows => { const w = Math.max(...rows.map(r => r.length)); const px = []; rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') px.push(x, y); })); return { w, h: rows.length, px }; };
  const SPR = {
    ship: sp(['###.......', '.####.....', '..#######.', '.#########', '..#######.', '.####.....', '###.......']),
    flame: sp(['#.', '.#', '#.']),
    e1: sp(['...###..', '..#####.', '.##.#.##', '########', '..#..#..', '.#....#.']),
    e2: sp(['#..#..#', '.#####.', '##.#.##', '.#####.', '##...##', '.#####.', '#..#..#']),
    e3: sp(['...######', '.########', '###.#####', '.########', '...######']),
    e4: sp(['..####..', '.######.', '##.##.##', '########', '.#.##.#.', '#......#', '.#....#.']),
    boss: sp([
      '.......########.......', '....##############....', '..######......######..', '.#####..######..#####.',
      '#####.##########.#####', '####.###......###.####', '####.##..####..##.####', '####.##..#..#..##.####',
      '####.##..####..##.####', '####.###......###.####', '#####.##########.#####', '.#####..######..#####.',
      '..######......######..', '....##############....', '...###.##.##.##.###...', '..###..##.##.##..###..',
      '.###...##....##...###.', '###....##....##....###'
    ]),
    heart: sp(['.#.#.', '#####', '.###.', '..#..']),
    missile: sp(['##...', '#####', '##...'])
  };

  /* ── 3×5 pixel font ── */
  const FONT = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', ' ': '000000000000000', ':': '000010000010000', '.': '000000000000010', '!': '010010010000010',
    '-': '000000111000000', '/': '001001010100100', '+': '000010111010000', 'x': '000101010101000', '?': '111001010000010'
  };
  const textW = (t, s = 1) => (String(t).length * 4 - 1) * s;
  function text(t, x, y, s = 1, color = FG) {
    ctx.fillStyle = color;
    t = norm(String(t)).toUpperCase();
    let cx = Math.round(x);
    for (const ch of t) {
      const g = FONT[ch] || FONT['?'];
      for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) * s, Math.round(y) + Math.floor(i / 3) * s, s, s);
      cx += 4 * s;
    }
  }
  const textC = (t, y, s = 1, color) => text(t, (W - textW(t, s)) / 2, y, s, color);
  function draw(s, x, y, color = FG) {
    ctx.fillStyle = color;
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < s.px.length; i += 2) ctx.fillRect(x + s.px[i], y + s.px[i + 1], 1, 1);
  }
  function panel(x, y, w, h) { ctx.fillStyle = BG; ctx.fillRect(x, y, w, h); ctx.fillStyle = FG; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); }

  /* ── Sound: Nokia-style square-wave beeps (WebAudio, created on the first keypress) ── */
  let ac = null, soundOn = store.getRaw('mybt-navecita-sound') !== '0';
  function audio() { if (!ac && soundOn) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return soundOn ? ac : null; }
  function tone(freq, dur, { type = 'square', vol = .045, slide = 0, delay = 0 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
  }
  let noiseBuf = null;
  function noise(dur = .14, vol = .06) {
    const a = audio(); if (!a) return;
    if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * .3, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(), g = a.createGain(), t = a.currentTime;
    s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(g).connect(a.destination); s.start(t); s.stop(t + dur);
  }
  const SFX = {
    shot: () => tone(1320, .035, { vol: .025 }),
    missile: () => tone(300, .18, { slide: 500, vol: .04 }),
    pop: () => noise(.1, .05),
    boom: () => { noise(.45, .09); tone(120, .4, { slide: -80, vol: .05 }); },
    hit: () => { tone(420, .3, { slide: -330, vol: .06 }); noise(.2, .05); },
    pick: () => { [660, 880, 1320].forEach((f, i) => tone(f, .06, { delay: i * .06, vol: .035 })); },
    level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .1, { delay: i * .1, vol: .04 })); },
    over: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, .18, { delay: i * .18, vol: .045 })); },
    start: () => { [784, 988, 1175].forEach((f, i) => tone(f, .07, { delay: i * .07, vol: .035 })); }
  };
  const buzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } };

  /* ── State ── */
  let state = 'title', tick = 0, timer = 0;
  let level = 1, score = 0, hi = Number(store.getRaw('mybt-navecita-hi')) || 0, newHi = false;
  let player, bullets = [], enemies = [], particles = [], pickups = [], boss = null, wavesLeft = 0, waveTimer = 0, shake = 0;
  const stars = Array.from({ length: 28 }, () => ({ x: Math.random() * W, y: TOP + 1 + Math.random() * (H - TOP - 2), s: Math.random() < .3 ? .9 : .4 }));

  function reset() {
    level = 1; score = 0; newHi = false;
    player = { x: 8, y: H / 2, w: SPR.ship.w, h: SPR.ship.h, cd: 0, inv: 90, lives: 3, specials: 3, rapid: 0 };
    startLevel();
  }
  function startLevel() {
    bullets = []; enemies = []; particles = []; pickups = []; boss = null;
    wavesLeft = 6 + level * 2; waveTimer = 40;
    player.x = 8; player.y = H / 2; player.inv = Math.max(player.inv, 60);
    state = 'intro'; timer = 100;
  }

  /* ── Waves ── */
  const ENEMY = {
    e1: { spr: 'e1', hp: 1, pts: 10 },
    e2: { spr: 'e2', hp: 2, pts: 15 },
    e3: { spr: 'e3', hp: 1, pts: 20 },
    e4: { spr: 'e4', hp: 3, pts: 30, shoots: true }
  };
  const speed = () => .42 + level * .08;
  function addEnemy(type, x, y, move, extra = {}) {
    const d = ENEMY[type], s = SPR[d.spr];
    enemies.push(Object.assign({ type, spr: s, x, y, y0: y, w: s.w, h: s.h, hp: d.hp + Math.floor((level - 1) / 2), pts: d.pts, move, t: 0, fire: 60 + Math.random() * 80, shoots: !!d.shoots, flash: 0 }, extra));
  }
  function spawnWave() {
    const kinds = level === 1 ? ['line', 'sine', 'line', 'dive'] : ['line', 'sine', 'dive', 'shooters', 'swarm', 'sine'];
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    const ymin = TOP + 4, ymax = H - 12;
    const ry = () => ymin + Math.random() * (ymax - ymin);
    if (k === 'line') { const y = ry(), t = Math.random() < .5 ? 'e1' : 'e3'; for (let i = 0; i < 5; i++) addEnemy(t, W + i * 13, y, 'straight'); }
    if (k === 'sine') { const y = ymin + 14 + Math.random() * (ymax - ymin - 28); for (let i = 0; i < 6; i++) addEnemy('e1', W + i * 11, y, 'sine', { amp: 10 + Math.random() * 8, ph: i * .55 }); }
    if (k === 'dive') { for (let i = 0; i < 4; i++) addEnemy('e3', W + i * 18, ry(), 'dive'); }
    if (k === 'shooters') { for (let i = 0; i < 2 + Math.min(2, level - 1); i++) addEnemy('e4', W + i * 22, ymin + 6 + i * ((ymax - ymin - 12) / 3), 'hover'); }
    if (k === 'swarm') { for (let i = 0; i < 7; i++) addEnemy('e2', W + Math.random() * 40, ry(), 'zig', { vy: (Math.random() < .5 ? -1 : 1) * .5 }); }
  }
  function spawnBoss() {
    const s = SPR.boss, max = 60 + (level - 1) * 35;
    boss = { spr: s, x: W + 4, y: H / 2 - s.h / 2 + 4, w: s.w, h: s.h, hp: max, max, t: 0, fire: 90, minions: 200, flash: 0 };
    SFX.boom();
  }

  /* ── Effects ── */
  function burst(x, y, n = 10, sp = 1.2) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = Math.random() * sp + .2; particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 18 + Math.random() * 18 }); }
  }
  const hitBox = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function addScore(n) {
    score += Math.round(n * (1 + (level - 1) * .25));
    if (score > hi) { hi = score; newHi = true; store.setRaw('mybt-navecita-hi', String(hi)); }
  }
  function killEnemy(e) {
    burst(e.x + e.w / 2, e.y + e.h / 2, 10);
    addScore(e.pts);
    SFX.pop();
    const r = Math.random();
    if (r < .05) pickups.push({ x: e.x, y: e.y, w: 7, h: 7, kind: 'M' });
    else if (r < .075) pickups.push({ x: e.x, y: e.y, w: 7, h: 7, kind: 'R' });
    else if (r < .088 && player.lives < 5) pickups.push({ x: e.x, y: e.y, w: 7, h: 7, kind: 'V' });
  }
  function hurtPlayer() {
    if (player.inv > 0) return;
    player.lives--;
    player.inv = 120;
    burst(player.x + 5, player.y + 3, 22, 1.6);
    shake = 10;
    SFX.hit(); buzz(120);
    if (player.lives <= 0) { state = 'over'; timer = 0; SFX.over(); buzz([80, 60, 160]); }
  }

  /* ── Input ── */
  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', Digit2: 'up', Numpad2: 'up',
    ArrowDown: 'down', KeyS: 'down', Digit8: 'down', Numpad8: 'down',
    ArrowLeft: 'left', KeyA: 'left', Digit4: 'left', Numpad4: 'left',
    ArrowRight: 'right', KeyD: 'right', Digit6: 'right', Numpad6: 'right',
    Space: 'fire', Digit5: 'fire', Numpad5: 'fire', KeyJ: 'fire', KeyK: 'fire',
    KeyX: 'special', Digit0: 'special', Numpad0: 'special', KeyL: 'special',
    KeyP: 'pause', Enter: 'start', NumpadEnter: 'start', NumpadMultiply: 'pause', KeyM: 'sound', NumpadDivide: 'sound'
  };
  function press(k) {
    if (k === 'sound') { toggleSound(); return; }
    if (k === 'pause') { togglePause(); return; }
    if (state === 'title' || (state === 'over' && timer > 40)) {
      if (k === 'fire' || k === 'start') { audio(); SFX.start(); reset(); }
      return;
    }
    if (state === 'paused') { if (k === 'start' || k === 'fire') togglePause(); return; }
    if (k === 'start') { togglePause(); return; }
    if (k === 'special' && (state === 'play' || state === 'intro')) fireSpecial();
    keys.add(k);
  }
  const release = k => keys.delete(k);

  screen.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key === '*' ? 'pause' : e.key === '#' ? 'sound' : KEYMAP[e.code];
    if (!k) { if (e.key === 'Escape' && state === 'play') togglePause(); return; }
    e.preventDefault(); e.stopPropagation();
    if (!e.repeat) press(k);
  });
  screen.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); release(k); } });
  // Leaving the game (focus goes elsewhere on the page) pauses it; its own buttons do not.
  screen.addEventListener('blur', () => { keys.clear(); setTimeout(() => { if (!wrap.contains(document.activeElement) && (state === 'play' || state === 'intro')) togglePause(true); }, 0); });
  screen.addEventListener('pointerdown', () => screen.focus({ preventScroll: true }));

  // Phone keypad (touch and mouse): hold to move or keep firing.
  $$('[data-gk]').forEach(b => {
    const k = b.dataset.gk;
    const down = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('down'); screen.focus({ preventScroll: true }); press(k); };
    const up = () => { b.classList.remove('down'); release(k); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });

  /* ── Update ── */
  function fire() {
    const rapid = player.rapid > 0;
    bullets.push({ x: player.x + 10, y: player.y + 3, w: 3, h: 1, vx: 3.2, vy: 0, mine: true, dmg: 1 });
    if (rapid) { bullets.push({ x: player.x + 8, y: player.y + 1, w: 3, h: 1, vx: 3, vy: -.35, mine: true, dmg: 1 }, { x: player.x + 8, y: player.y + 5, w: 3, h: 1, vx: 3, vy: .35, mine: true, dmg: 1 }); }
    player.cd = rapid ? 7 : 10;
    SFX.shot();
  }
  function fireSpecial() {
    if (player.specials <= 0) { tone(160, .08, { vol: .03 }); return; }
    player.specials--;
    bullets.push({ x: player.x + 6, y: player.y + 2, w: 5, h: 3, vx: 2.1, vy: 0, mine: true, dmg: 8, pierce: true, missile: true });
    SFX.missile();
  }
  function enemyShot(x, y, aim) {
    const sp2 = 1.05 + level * .1;
    let vx = -sp2, vy = 0;
    if (aim) { const dx = player.x + 5 - x, dy = player.y + 3 - y, d = Math.hypot(dx, dy) || 1; vx = dx / d * sp2; vy = dy / d * sp2; }
    bullets.push({ x, y, w: 2, h: 2, vx, vy, mine: false });
  }

  function update() {
    tick++;
    for (const s of stars) { s.x -= s.s * (state === 'play' || state === 'intro' ? 1 : .3); if (s.x < 0) { s.x = W; s.y = TOP + 1 + Math.random() * (H - TOP - 2); } }
    if (shake > 0) shake--;
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy *= .96; p.life--; }
    particles = particles.filter(p => p.life > 0);

    if (state === 'title' || state === 'paused') return;
    if (state === 'over') { timer++; return; }
    if (state === 'intro' || state === 'clear') {
      if (--timer <= 0) { if (state === 'clear') { level++; startLevel(); } else state = 'play'; }
      if (state === 'clear') { player.x += (player.x < W + 20) ? 1.4 : 0; return; }
    }

    // Player
    const v = 1.05;
    if (keys.has('up')) player.y -= v;
    if (keys.has('down')) player.y += v;
    if (keys.has('left')) player.x -= v;
    if (keys.has('right')) player.x += v;
    player.x = Math.max(1, Math.min(W * .72, player.x));
    player.y = Math.max(TOP + 1, Math.min(H - player.h - 1, player.y));
    if (player.cd > 0) player.cd--;
    if (player.inv > 0) player.inv--;
    if (player.rapid > 0) player.rapid--;
    if (keys.has('fire') && player.cd <= 0 && state === 'play') fire();
    if (state !== 'play') return;

    // Waves, then the boss
    if (!boss) {
      if (wavesLeft > 0 && --waveTimer <= 0) { spawnWave(); wavesLeft--; waveTimer = Math.max(70, 150 - level * 10); }
      if (wavesLeft <= 0 && enemies.length === 0) spawnBoss();
    }

    // Enemies
    const spd = speed();
    for (const e of enemies) {
      e.t++;
      if (e.flash > 0) e.flash--;
      if (e.move === 'straight') e.x -= spd * 1.1;
      else if (e.move === 'sine') { e.x -= spd; e.y = e.y0 + Math.sin(e.t * .06 + e.ph) * e.amp; }
      else if (e.move === 'dive') { e.x -= spd * 1.5; e.y += Math.sign(player.y - e.y) * Math.min(.45, Math.abs(player.y - e.y) * .02); }
      else if (e.move === 'zig') { e.x -= spd * .9; e.y += e.vy; if (e.y < TOP + 1 || e.y > H - e.h - 1) e.vy *= -1; }
      else if (e.move === 'hover') { if (e.x > W - 34) e.x -= spd; else e.y = e.y0 + Math.sin(e.t * .03) * 8; if (e.t > 520) e.x -= spd * 1.4; }
      if (e.shoots && e.x < W - 4 && --e.fire <= 0) { enemyShot(e.x, e.y + 3, true); e.fire = Math.max(55, 120 - level * 8) + Math.random() * 40; }
      if (hitBox(e, player)) { e.hp = 0; killEnemy(e); hurtPlayer(); }
    }
    enemies = enemies.filter(e => e.hp > 0 && e.x > -e.w - 4);

    // Boss
    if (boss) {
      const b = boss;
      b.t++;
      if (b.flash > 0) b.flash--;
      const enraged = b.hp < b.max / 2;
      if (b.x > W - b.w - 4) b.x -= .5;
      else b.y = (H + TOP) / 2 - b.h / 2 + Math.sin(b.t * (enraged ? .03 : .02)) * ((H - TOP) / 2 - b.h / 2 - 2);
      if (--b.fire <= 0) {
        const cx = b.x, cy = b.y + b.h / 2;
        enemyShot(cx, cy, true);
        if (enraged || level > 1) { bullets.push({ x: cx, y: cy, w: 2, h: 2, vx: -1.2, vy: -.5, mine: false }, { x: cx, y: cy, w: 2, h: 2, vx: -1.2, vy: .5, mine: false }); }
        b.fire = (enraged ? 45 : 70) - Math.min(25, level * 4);
      }
      if (--b.minions <= 0) { addEnemy('e2', b.x, b.y + 2, 'zig', { vy: -.6 }); addEnemy('e2', b.x, b.y + b.h - 8, 'zig', { vy: .6 }); b.minions = enraged ? 160 : 240; }
      if (hitBox(b, player)) hurtPlayer();
    }

    // Bullets
    for (const u of bullets) { u.x += u.vx; u.y += u.vy; }
    for (const u of bullets) {
      if (u.dead) continue;
      if (u.mine) {
        for (const e of enemies) {
          if (e.hp > 0 && hitBox(u, e)) {
            e.hp -= u.dmg; e.flash = 4;
            if (e.hp <= 0) killEnemy(e); else tone(220, .03, { vol: .02 });
            if (!u.pierce) { u.dead = true; break; }
          }
        }
        if (!u.dead && boss && hitBox(u, boss)) {
          boss.hp -= u.dmg; boss.flash = 3; u.dead = true;
          burst(u.x + 2, u.y, 3, .8);
          if (u.missile) burst(u.x, u.y, 12, 1.4);
          if (boss.hp <= 0) {
            burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 60, 2.2);
            addScore(500 + level * 250);
            boss = null; shake = 18; SFX.boom(); buzz(200);
            enemies.forEach(e => burst(e.x, e.y, 6)); enemies = [];
            bullets.forEach(b2 => { if (!b2.mine) b2.dead = true; });
            setTimeout(SFX.level, 500);
            state = 'clear'; timer = 170;
          }
        }
      } else if (hitBox(u, player)) { u.dead = true; hurtPlayer(); }
    }
    bullets = bullets.filter(u => !u.dead && u.x > -6 && u.x < W + 6 && u.y > TOP - 2 && u.y < H + 2);

    // Power-ups: M = 3 misiles · R = disparo triple · V = vida
    for (const p of pickups) {
      p.x -= .55;
      if (hitBox(p, player)) {
        p.got = true; SFX.pick(); buzz(30);
        if (p.kind === 'M') player.specials = Math.min(9, player.specials + 3);
        if (p.kind === 'R') player.rapid = 60 * 10;
        if (p.kind === 'V') player.lives = Math.min(5, player.lives + 1);
        addScore(25);
      }
    }
    pickups = pickups.filter(p => !p.got && p.x > -8);
  }

  /* ── Render ── */
  function hud() {
    for (let i = 0; i < player.lives; i++) draw(SPR.heart, 1 + i * 6, 1);
    draw(SPR.missile, 36, 2); text(player.specials, 43, 1);
    if (player.rapid > 0 && (player.rapid > 120 || tick % 10 < 6)) text('x3', 52, 1);
    text(String(score).padStart(5, '0'), W - textW('00000') - 1, 1);
    ctx.fillStyle = FG; ctx.fillRect(0, 7, W, 1);
    if (boss) { const w = 40; ctx.fillRect(W / 2 - w / 2, 2, 1, 4); ctx.fillRect(W / 2 + w / 2, 2, 1, 4); ctx.fillRect(W / 2 - w / 2 + 1, 3, Math.ceil((w - 1) * boss.hp / boss.max), 2); }
    else text('N' + level, W / 2 - 4, 1);
  }
  function world() {
    ctx.fillStyle = FG;
    for (const s of stars) ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s > .5 ? 2 : 1, 1);
    for (const p of pickups) { panel(Math.round(p.x), Math.round(p.y), 7, 7); text(p.kind, Math.round(p.x) + 2, Math.round(p.y) + 1); }
    for (const e of enemies) if (!(e.flash && tick % 2)) draw(e.spr, e.x, e.y);
    if (boss && !(boss.flash && tick % 2)) draw(boss.spr, boss.x, boss.y);
    ctx.fillStyle = FG;
    for (const u of bullets) {
      if (u.missile) draw(SPR.missile, u.x, u.y);
      else ctx.fillRect(Math.round(u.x), Math.round(u.y), u.w, u.h);
    }
    if (player.lives > 0 && !(player.inv > 0 && tick % 8 < 4)) {
      draw(SPR.ship, player.x, player.y);
      if (tick % 6 < 3) draw(SPR.flame, player.x - 2, player.y + 2);
    }
    ctx.fillStyle = FG;
    for (const p of particles) ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  function render() {
    ctx.save();
    if (shake > 0) ctx.translate(Math.round((Math.random() - .5) * 2), Math.round((Math.random() - .5) * 2));
    if (state === 'title') {
      ctx.drawImage(art('title'), 0, 0);
      panel(18, 60, W - 36, 33);
      textC('NAVECITA', 63, 2);
      if (tick % 60 < 40) textC('PULSA 5 O ENTER', 77);
      textC('RECORD ' + String(hi).padStart(5, '0'), 85);
    } else if (state === 'over') {
      ctx.drawImage(art('over'), 0, 0);
      panel(14, 22, W - 28, 52);
      textC('FIN DEL JUEGO', 27, 1);
      textC('PUNTOS ' + score, 39);
      textC(newHi ? 'NUEVO RECORD!' : 'RECORD ' + hi, 48);
      textC('NIVEL ' + level, 57);
      if (timer > 40 && tick % 60 < 40) textC('5: OTRA VEZ', 66);
    } else {
      // A little LCD ghosting: the previous frame fades instead of vanishing at once.
      ctx.globalAlpha = .62; ctx.fillStyle = BG; ctx.fillRect(-2, -2, W + 4, H + 4); ctx.globalAlpha = 1;
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, TOP);
      world(); hud();
      if (state === 'intro') { panel(W / 2 - 34, 36, 68, 22); textC('NIVEL ' + level, 41, 2); }
      if (state === 'clear' && timer < 150) { panel(W / 2 - 46, 34, 92, 26); textC('NIVEL ' + level, 38); textC('SUPERADO!', 46, 2); }
      if (state === 'paused') { panel(W / 2 - 34, 34, 68, 28); textC('PAUSA', 38, 2); textC('5: SEGUIR', 53); }
    }
    ctx.restore();
  }

  /* ── Side panel (DOM only changes when a value changes) ── */
  const out = { score: $('#gScore'), hi: $('#gHi'), level: $('#gLevel'), lives: $('#gLives'), play: $('#gPlay') };
  const last = {};
  function setOut(k, v) { if (last[k] !== v) { last[k] = v; out[k].textContent = v; } }
  function syncPanel() {
    setOut('score', score.toLocaleString('es-CO'));
    setOut('hi', hi.toLocaleString('es-CO'));
    setOut('level', String(level));
    setOut('lives', player ? '♥'.repeat(Math.max(0, player.lives)) || '—' : '♥♥♥');
    setOut('play', state === 'play' || state === 'intro' || state === 'clear' ? 'Pausa' : state === 'paused' ? 'Seguir' : 'Jugar');
  }

  /* ── Loop: runs only while the game is on screen ── */
  let raf = 0, prev = 0, acc = 0, onScreen = false;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    acc += Math.min(100, t - (prev || t)); prev = t;
    let n = 0;
    while (acc >= STEP && n++ < 6) { update(); acc -= STEP; }
    render();
    syncPanel();
  }
  function run() { if (!raf && onScreen && !document.hidden) { prev = 0; acc = 0; raf = requestAnimationFrame(frame); } }
  function halt() { cancelAnimationFrame(raf); raf = 0; }

  function togglePause(force) {
    if (state === 'play' || state === 'intro') { state = 'paused'; keys.clear(); tone(440, .06, { vol: .03 }); }
    else if (state === 'paused' && !force) { state = 'play'; tone(660, .06, { vol: .03 }); }
    render(); syncPanel();
  }
  function toggleSound() {
    soundOn = !soundOn;
    store.setRaw('mybt-navecita-sound', soundOn ? '1' : '0');
    $('#gSound').textContent = soundOn ? 'Sonido: sí' : 'Sonido: no';
    if (soundOn) SFX.pick();
    toast(soundOn ? 'Sonido activado' : 'Sonido apagado', 'info');
  }
  function cycleLook() {
    const ks = Object.keys(LOOKS);
    look = ks[(ks.indexOf(look) + 1) % ks.length];
    store.setRaw('mybt-navecita-lcd', look);
    applyLook();
    toast('Pantalla: ' + LOOKS[look].name, 'info');
  }
  function applyLook() {
    BG = LOOKS[look].bg; FG = LOOKS[look].fg;
    screen.style.setProperty('--lcd-bg', BG); screen.style.setProperty('--lcd-fg', FG);
    $('#gLook').textContent = 'Pantalla: ' + LOOKS[look].name;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    render();
  }

  new IntersectionObserver(([en]) => {
    onScreen = en.isIntersecting;
    if (onScreen) run(); else { if (state === 'play' || state === 'intro') togglePause(true); halt(); }
  }, { threshold: .15 }).observe(screen);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (state === 'play') togglePause(true); halt(); } else run(); });
  // Opening the menu pauses the game.
  new MutationObserver(() => { if (document.body.classList.contains('nav-open') && (state === 'play' || state === 'intro')) togglePause(true); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ── Buttons ── */
  wrap.addEventListener('click', e => {
    const b = e.target.closest('[data-game]');
    if (!b) return;
    const a = b.dataset.game;
    if (a === 'play') { if (state === 'title' || state === 'over') { audio(); SFX.start(); reset(); } else togglePause(); screen.focus({ preventScroll: true }); }
    if (a === 'restart') { audio(); SFX.start(); reset(); screen.focus({ preventScroll: true }); }
    if (a === 'sound') { toggleSound(); screen.focus({ preventScroll: true }); }
    if (a === 'look') { cycleLook(); screen.focus({ preventScroll: true }); }
    if (a === 'full') {
      const el = $('.phone-screen', wrap);
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().then(() => screen.focus({ preventScroll: true })).catch(() => toast('Pantalla completa no disponible', 'info'));
      else toast('Pantalla completa no disponible', 'info');
    }
  });

  /** Alt+C in the game: copies your record. */
  function copyScore(btn) { copyText(`Mi récord en Navecita (MYBT): ${hi.toLocaleString('es-CO')} puntos`, btn, 'Récord copiado'); }
  function restart() { audio(); SFX.start(); reset(); screen.focus({ preventScroll: true }); toast('Partida nueva', 'info'); }

  // Boot
  player = { lives: 3, specials: 3, rapid: 0 };
  $('#gSound').textContent = soundOn ? 'Sonido: sí' : 'Sonido: no';
  applyLook();
  syncPanel();

  return { copyScore, restart };
})();
