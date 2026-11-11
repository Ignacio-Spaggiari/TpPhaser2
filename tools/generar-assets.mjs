// Genera los assets del juego (tileset, sprite del ninja, sonidos y el mapa de Tiled).
// Uso: node tools/generar-assets.mjs
// El mapa resultante (public/assets/tilemap/map.json) se puede abrir y editar con Tiled.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ASSETS = new URL("../public/assets/", import.meta.url);
const ruta = (p) => new URL(p, ASSETS);

// ---------------------------------------------------------------------------
// Imagenes: lienzo RGBA + codificador PNG minimo
// ---------------------------------------------------------------------------

class Lienzo {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = Buffer.alloc(w * h * 4);
  }

  set(x, y, [r, g, b, a = 255]) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.px[i] = r;
    this.px[i + 1] = g;
    this.px[i + 2] = b;
    this.px[i + 3] = a;
  }

  rect(x, y, w, h, color) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, color);
  }

  // Rellena todos los pixeles cuyo centro cumple la condicion
  forma(x0, y0, w, h, dentro, color) {
    for (let j = y0; j < y0 + h; j++)
      for (let i = x0; i < x0 + w; i++) if (dentro(i + 0.5, j + 0.5)) this.set(i, j, color);
  }

  elipse(cx, cy, rx, ry, color) {
    this.forma(
      Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(rx * 2) + 1, Math.ceil(ry * 2) + 1,
      (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
      color
    );
  }

  poligono(puntos, color) {
    const xs = puntos.map((p) => p[0]);
    const ys = puntos.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs));
    const y0 = Math.floor(Math.min(...ys));
    this.forma(
      x0, y0, Math.ceil(Math.max(...xs)) - x0 + 1, Math.ceil(Math.max(...ys)) - y0 + 1,
      (x, y) => dentroPoligono(x, y, puntos),
      color
    );
  }

  png() {
    const filas = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      filas[y * (this.w * 4 + 1)] = 0;
      this.px.copy(filas, y * (this.w * 4 + 1) + 1, y * this.w * 4, (y + 1) * this.w * 4);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr.set([8, 6, 0, 0, 0], 8);
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(filas)),
      chunk("IEND", Buffer.alloc(0)),
    ]);
  }
}

function dentroPoligono(x, y, pts) {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];
const mezclar = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// ---------------------------------------------------------------------------
// Tileset (tiles de 24x24, 8 columnas x 4 filas)
// ---------------------------------------------------------------------------

const T = 24;
const COLUMNAS = 8;
const tileset = new Lienzo(T * COLUMNAS, T * 4);
const origen = (id) => [(id % COLUMNAS) * T, Math.floor(id / COLUMNAS) * T];

// Fila 0: cielo del atardecer (ids 0-3), nubes (4-6), luna (7)
const CIELO = ["#2b2a5c", "#5a3f7a", "#b45f86", "#f29e7a", "#fbd38d"].map((c) => hex(c));
for (let id = 0; id < 4; id++) {
  const [ox, oy] = origen(id);
  for (let y = 0; y < T; y++) tileset.rect(ox, oy + y, T, 1, mezclar(CIELO[id], CIELO[id + 1], y / T));
}

const NUBE = hex("#ffe4ec", 220);
const NUBE_SOMBRA = hex("#f3b8c9", 220);
{
  const [ox, oy] = origen(4);
  tileset.elipse(ox + 18, oy + 15, 9, 6, NUBE_SOMBRA);
  tileset.elipse(ox + 18, oy + 13, 9, 6, NUBE);
  const [mx, my] = origen(5);
  tileset.rect(mx, my + 13, T, 8, NUBE_SOMBRA);
  tileset.elipse(mx + 12, my + 10, 12, 9, NUBE);
  tileset.rect(mx, my + 12, T, 7, NUBE);
  const [dx, dy] = origen(6);
  tileset.elipse(dx + 6, dy + 15, 9, 6, NUBE_SOMBRA);
  tileset.elipse(dx + 6, dy + 13, 9, 6, NUBE);
  const [lx, ly] = origen(7);
  tileset.elipse(lx + 12, ly + 12, 10, 10, hex("#fff3c4"));
  tileset.elipse(lx + 8, ly + 9, 2, 2, hex("#f0dca0"));
  tileset.elipse(lx + 15, ly + 15, 3, 2, hex("#f0dca0"));
}

// Fila 1: montañas (8-10 cima/laderas, 11 relleno), casa del pueblo (12 techo, 13 pared), arbusto (14), farol (15)
const MONTE = hex("#4a3466");
const MONTE_NIEVE = hex("#e9d9f2");
{
  const [ax, ay] = origen(8);
  tileset.poligono([[ax, ay + T], [ax + T, ay], [ax + T, ay + T]], MONTE);
  const [bx, by] = origen(9);
  tileset.poligono([[bx, by + T], [bx + 12, by + 2], [bx + T, by + T]], MONTE);
  tileset.poligono([[bx + 7, by + 10], [bx + 12, by + 2], [bx + 17, by + 10], [bx + 14, by + 8], [bx + 12, by + 11], [bx + 10, by + 8]], MONTE_NIEVE);
  const [cx, cy] = origen(10);
  tileset.poligono([[cx, cy], [cx + T, cy + T], [cx, cy + T]], MONTE);
  const [dx, dy] = origen(11);
  tileset.rect(dx, dy, T, T, MONTE);

  const [tx, ty] = origen(12);
  tileset.poligono([[tx - 1, ty + 22], [tx + 4, ty + 10], [tx + 20, ty + 10], [tx + 25, ty + 22]], hex("#8c2f39"));
  tileset.rect(tx + 2, ty + 20, 20, 2, hex("#5e1f27"));
  tileset.poligono([[tx + 6, ty + 10], [tx + 12, ty + 3], [tx + 18, ty + 10]], hex("#a63d48"));
  const [px, py] = origen(13);
  tileset.rect(px + 2, py, 20, T, hex("#d9c3a0"));
  tileset.rect(px + 2, py, 20, 2, hex("#5e1f27"));
  tileset.rect(px + 4, py + 6, 6, 6, hex("#ffd36b"));
  tileset.rect(px + 14, py + 10, 6, 14, hex("#6b4a2f"));
  tileset.rect(px + 6, py + 6, 2, 6, hex("#6b4a2f"));

  const [ex, ey] = origen(14);
  tileset.elipse(ex + 12, ey + 18, 11, 7, hex("#2f6b3a"));
  tileset.elipse(ex + 8, ey + 15, 6, 5, hex("#3d8a49"));
  tileset.elipse(ex + 16, ey + 14, 5, 5, hex("#3d8a49"));

  const [fx, fy] = origen(15);
  tileset.rect(fx + 11, fy + 10, 2, 14, hex("#3a2a20"));
  tileset.elipse(fx + 12, fy + 7, 5, 6, hex("#e8503a"));
  tileset.elipse(fx + 12, fy + 7, 3, 4, hex("#ffb35c"));
}

// Fila 2: piso de pasto (16-18), tierra (19), plataforma de madera (20-22), piedra (23)
const PASTO = hex("#5fbf4a");
const PASTO_OSCURO = hex("#3f8f35");
const TIERRA = hex("#8a5a3b");
const TIERRA_OSCURA = hex("#6b4129");
{
  for (let id = 16; id <= 19; id++) {
    const [ox, oy] = origen(id);
    tileset.rect(ox, oy, T, T, TIERRA);
    for (let k = 0; k < 6; k++) tileset.rect(ox + ((k * 7 + id * 3) % 21), oy + 6 + ((k * 5) % 16), 3, 2, TIERRA_OSCURA);
    if (id === 19) continue;
    tileset.rect(ox, oy, T, 7, PASTO);
    for (let i = 0; i < T; i += 3) tileset.rect(ox + i, oy + 7, 2, 1 + (i % 2) * 2, PASTO_OSCURO);
    tileset.rect(ox, oy, T, 1, hex("#9be07e"));
  }
  // bordes redondeados en las puntas del piso
  const [lx, ly] = origen(16);
  tileset.rect(lx, ly, 2, T, PASTO_OSCURO);
  const [rx, ry] = origen(18);
  tileset.rect(rx + T - 2, ry, 2, T, PASTO_OSCURO);

  const MADERA = hex("#c7843e");
  const MADERA_CLARA = hex("#e3a55a");
  const MADERA_OSCURA = hex("#7a4a22");
  for (let id = 20; id <= 22; id++) {
    const [ox, oy] = origen(id);
    tileset.rect(ox, oy + 2, T, 14, MADERA);
    tileset.rect(ox, oy + 2, T, 2, MADERA_CLARA);
    tileset.rect(ox, oy + 14, T, 2, MADERA_OSCURA);
    tileset.rect(ox, oy + 8, T, 1, MADERA_OSCURA);
    tileset.rect(ox + 11, oy + 4, 2, 2, MADERA_OSCURA);
  }
  const [ax, ay] = origen(20);
  tileset.rect(ax, ay + 2, 2, 14, MADERA_OSCURA);
  tileset.rect(ax + 4, ay + 16, 3, 6, MADERA_OSCURA);
  const [bx, by] = origen(22);
  tileset.rect(bx + T - 2, by + 2, 2, 14, MADERA_OSCURA);
  tileset.rect(bx + T - 7, by + 16, 3, 6, MADERA_OSCURA);

  const [px, py] = origen(23);
  tileset.rect(px, py, T, T, hex("#7d7f8c"));
  tileset.rect(px, py, T, 2, hex("#a9abb8"));
  tileset.rect(px, py + 11, T, 2, hex("#5b5d68"));
  tileset.rect(px + 11, py, 2, 11, hex("#5b5d68"));
  tileset.rect(px + 5, py + 13, 2, 11, hex("#5b5d68"));
}

// Fila 3: figuras recolectables (24 cuadrado, 25 triangulo, 26 rombo) y asteroide maldito (27)
{
  const contorno = hex("#1d1b2e");
  const [ax, ay] = origen(24);
  tileset.rect(ax + 3, ay + 3, 18, 18, contorno);
  tileset.rect(ax + 5, ay + 5, 14, 14, hex("#3fa7f5"));
  tileset.rect(ax + 5, ay + 5, 14, 3, hex("#8fd0ff"));

  const [bx, by] = origen(25);
  tileset.poligono([[bx + 12, by + 1], [bx + 23, by + 22], [bx + 1, by + 22]], contorno);
  tileset.poligono([[bx + 12, by + 5], [bx + 20, by + 20], [bx + 4, by + 20]], hex("#5ad15a"));
  tileset.poligono([[bx + 12, by + 5], [bx + 14, by + 9], [bx + 10, by + 9]], hex("#b0f59a"));

  const [cx, cy] = origen(26);
  tileset.poligono([[cx + 12, cy], [cx + 23, cy + 12], [cx + 12, cy + 24], [cx + 1, cy + 12]], contorno);
  tileset.poligono([[cx + 12, cy + 3], [cx + 20, cy + 12], [cx + 12, cy + 21], [cx + 4, cy + 12]], hex("#ffc93c"));
  tileset.poligono([[cx + 12, cy + 3], [cx + 16, cy + 8], [cx + 12, cy + 8], [cx + 8, cy + 8]], hex("#fff0a8"));

  const [dx, dy] = origen(27);
  const puntas = [];
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    const r = k % 2 ? 7 : 11.5;
    puntas.push([dx + 12 + Math.cos(ang) * r, dy + 12 + Math.sin(ang) * r]);
  }
  tileset.poligono(puntas, contorno);
  tileset.elipse(dx + 12, dy + 12, 7, 7, hex("#d43a4a"));
  tileset.elipse(dx + 10, dy + 10, 2.5, 2.5, hex("#ff8a8a"));
  // carita enojada
  tileset.rect(dx + 8, dy + 12, 2, 2, contorno);
  tileset.rect(dx + 14, dy + 12, 2, 2, contorno);
  tileset.rect(dx + 9, dy + 16, 6, 1, contorno);
}

writeFileSync(ruta("tileset.png"), tileset.png());

// ---------------------------------------------------------------------------
// Ninja Moncho: spritesheet 9 frames de 32x32
// 0-3 caminando a la izquierda, 4 de frente, 5-8 caminando a la derecha
// ---------------------------------------------------------------------------

const F = 32;
const ninja = new Lienzo(F * 9, F);
const PIES = [
  [[10, 29], [22, 29]],
  [[8, 28], [21, 30]],
  [[10, 29], [22, 29]],
  [[11, 30], [24, 28]],
];

function dibujarNinja(frame, dir, paso) {
  const ox = frame * F;
  const bob = paso % 2 ? 1 : 0;
  const gris = hex("#5d6466");
  const grisOscuro = hex("#3e4446");
  const negro = hex("#262a2c");
  const amarillo = hex("#ffd93b");
  const amarilloOscuro = hex("#f0bd2a");

  // cintas de la vincha (del lado contrario a donde mira)
  if (dir !== 0) {
    const lado = -dir;
    const bx = ox + 16 + lado * 10;
    ninja.poligono([[bx, 6 + bob], [bx + lado * 7, 2 + bob], [bx + lado * 6, 7 + bob]], gris);
    ninja.poligono([[bx, 8 + bob], [bx + lado * 6, 9 + bob], [bx + lado * 4, 12 + bob]], grisOscuro);
  } else {
    ninja.poligono([[ox + 24, 5], [ox + 30, 1], [ox + 29, 6]], gris);
  }

  // pies
  for (const [px, py] of PIES[paso]) ninja.elipse(ox + px, py - bob * 0, 3.5, 2.2, negro);

  // cuerpo
  ninja.elipse(ox + 16, 15 + bob, 12, 12, grisOscuro);
  ninja.elipse(ox + 17, 14 + bob, 11, 11, gris);

  // antifaz amarillo
  const desv = dir * 2;
  ninja.forma(
    ox + 4, 8 + bob, 25, 12,
    (x, y) => {
      const lx = x - (ox + 16 + desv);
      const ly = y - (14 + bob);
      return Math.abs(ly) <= 4 - Math.abs(lx) / 14 && ((x - (ox + 17)) / 11) ** 2 + ((y - (14 + bob)) / 11) ** 2 <= 1;
    },
    amarillo
  );
  ninja.rect(ox + 6, 17 + bob, 20, 1, amarilloOscuro);

  // ojos
  const ojos = dir === 0 ? [12, 21] : [12 + desv, 21 + desv];
  for (const ex of ojos) {
    ninja.elipse(ox + ex, 14 + bob, 3, 3, hex("#ffffff"));
    ninja.elipse(ox + ex + dir, 14 + bob, 1.6, 1.8, negro);
  }
  // cejas enojadas
  ninja.poligono([[ox + ojos[0] - 4, 9 + bob], [ox + ojos[0] + 3, 11 + bob], [ox + ojos[0] + 3, 12 + bob], [ox + ojos[0] - 4, 10 + bob]], negro);
  ninja.poligono([[ox + ojos[1] + 4, 9 + bob], [ox + ojos[1] - 3, 11 + bob], [ox + ojos[1] - 3, 12 + bob], [ox + ojos[1] + 4, 10 + bob]], negro);
}

for (let i = 0; i < 4; i++) dibujarNinja(i, -1, i);
dibujarNinja(4, 0, 0);
for (let i = 0; i < 4; i++) dibujarNinja(5 + i, 1, i);

writeFileSync(ruta("ninja.png"), ninja.png());

// ---------------------------------------------------------------------------
// Sonidos (WAV mono 16 bits)
// ---------------------------------------------------------------------------

const HZ = 22050;

function wav(muestras) {
  const datos = Buffer.alloc(muestras.length * 2);
  muestras.forEach((m, i) => datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, m)) * 32767 * 0.6), i * 2));
  const cab = Buffer.alloc(44);
  cab.write("RIFF", 0);
  cab.writeUInt32LE(36 + datos.length, 4);
  cab.write("WAVEfmt ", 8);
  cab.writeUInt32LE(16, 16);
  cab.writeUInt16LE(1, 20);
  cab.writeUInt16LE(1, 22);
  cab.writeUInt32LE(HZ, 24);
  cab.writeUInt32LE(HZ * 2, 28);
  cab.writeUInt16LE(2, 32);
  cab.writeUInt16LE(16, 34);
  cab.write("data", 36);
  cab.writeUInt32LE(datos.length, 40);
  return Buffer.concat([cab, datos]);
}

const ONDAS = {
  cuadrada: (f) => (f % 1 < 0.5 ? 1 : -1) * 0.5,
  seno: (f) => Math.sin(f * Math.PI * 2),
  triangular: (f) => 1 - 4 * Math.abs((f % 1) - 0.5),
  ruido: () => Math.random() * 2 - 1,
};

// notas: [[frecuenciaInicial, frecuenciaFinal, duracionSeg], ...]
function sonido(notas, onda = "cuadrada", volumen = 0.8) {
  const salida = [];
  let fase = 0;
  for (const [f0, f1, dur] of notas) {
    const n = Math.floor(dur * HZ);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      fase += (f0 + (f1 - f0) * t) / HZ;
      const env = Math.min(1, i / (HZ * 0.005)) * (1 - t) ** 1.5;
      salida.push(ONDAS[onda](fase) * env * volumen);
    }
  }
  return wav(salida);
}

const SONIDOS = {
  recolectar: sonido([[880, 880, 0.06], [1320, 1320, 0.12]]),
  malo: sonido([[320, 90, 0.35]], "triangular"),
  rebote: sonido([[180, 90, 0.08]], "seno", 0.6),
  salto: sonido([[300, 620, 0.14]], "cuadrada", 0.5),
  ganar: sonido([[523, 523, 0.12], [659, 659, 0.12], [784, 784, 0.12], [1047, 1047, 0.4]]),
  perder: sonido([[392, 392, 0.18], [330, 330, 0.18], [262, 262, 0.18], [196, 130, 0.5]], "triangular"),
  click: sonido([[600, 600, 0.05]], "cuadrada", 0.4),
};

mkdirSync(ruta("sonidos/"), { recursive: true });
for (const [nombre, buf] of Object.entries(SONIDOS)) writeFileSync(ruta(`sonidos/${nombre}.wav`), buf);

// ---------------------------------------------------------------------------
// Mapa de Tiled (30x30 tiles de 24px = 720x720)
// ---------------------------------------------------------------------------

const ANCHO = 30;
const ALTO = 30;
const vacia = () => new Array(ANCHO * ALTO).fill(0);
const poner = (capa, x, y, id) => (capa[y * ANCHO + x] = id + 1); // gid = id + 1

// Fondo: degradé de cielo; Montanas: cordillera (va en otra capa porque las laderas tienen transparencia)
const fondo = vacia();
const montes = vacia();
for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) poner(fondo, x, y, Math.min(3, Math.floor(y / 6)));
const ALTURA_MONTES = [22, 21, 20, 19, 20, 21, 21, 20, 19, 18, 17, 18, 19, 20, 21, 22, 21, 20, 19, 18, 19, 20, 21, 20, 19, 18, 19, 20, 21, 22];
for (let x = 0; x < ANCHO; x++) {
  const h = ALTURA_MONTES[x];
  const izq = ALTURA_MONTES[x - 1] ?? h;
  const der = ALTURA_MONTES[x + 1] ?? h;
  // la fila mas chica es la mas alta: 9 = cima, 8 = ladera "/", 10 = ladera "\"
  let cima = 11;
  if (izq > h && der > h) cima = 9;
  else if (der < h && izq >= h) cima = 8;
  else if (izq < h && der >= h) cima = 10;
  poner(montes, x, h, cima);
  for (let y = h + 1; y < 28; y++) poner(montes, x, y, 11);
}

// Decoracion: nubes, luna, casas del pueblo, arbustos y faroles
const deco = vacia();
const nube = (x, y, largo) => {
  poner(deco, x, y, 4);
  for (let i = 1; i <= largo; i++) poner(deco, x + i, y, 5);
  poner(deco, x + largo + 1, y, 6);
};
nube(2, 3, 2);
nube(19, 2, 3);
nube(11, 7, 1);
nube(24, 9, 1);
poner(deco, 26, 4, 7);
for (const x of [1, 6, 22, 27]) {
  poner(deco, x, 26, 12);
  poner(deco, x, 27, 13);
}
for (const x of [3, 9, 17, 25]) poner(deco, x, 27, 14);
for (const x of [12, 19]) poner(deco, x, 27, 15);

// Plataformas: piso inferior
const plataformas = vacia();
for (let x = 0; x < ANCHO; x++) {
  poner(plataformas, x, 28, x === 0 ? 16 : x === ANCHO - 1 ? 18 : 17);
  poner(plataformas, x, 29, 19);
}

const prop = (name, type, value) => ({ name, type, value });
const colisionable = [16, 17, 18, 19, 20, 21, 22, 23].map((id) => ({ id, properties: [prop("esColisionable", "bool", true)] }));
const figura = (id, tipo, color) => ({
  id,
  properties: [prop("color", "string", color), prop("tipo", "string", tipo)],
});

const capaTiles = (id, name, data) => ({ data, height: ALTO, id, name, opacity: 1, type: "tilelayer", visible: true, width: ANCHO, x: 0, y: 0 });

const mapa = {
  compressionlevel: -1,
  height: ALTO,
  infinite: false,
  layers: [
    capaTiles(1, "Fondo", fondo),
    capaTiles(2, "Montanas", montes),
    capaTiles(3, "Decoracion", deco),
    capaTiles(4, "Plataformas", plataformas),
    {
      draworder: "topdown",
      id: 5,
      name: "Objetos",
      objects: [
        { height: 0, id: 1, name: "player", point: true, rotation: 0, type: "", visible: true, width: 0, x: 360, y: 640 },
        { height: 24, id: 2, name: "zonaCaida", rotation: 0, type: "", visible: true, width: 672, x: 24, y: -36 },
      ],
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 6,
  nextobjectid: 3,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.2",
  tileheight: T,
  tilesets: [
    {
      columns: COLUMNAS,
      firstgid: 1,
      image: "../tileset.png",
      imageheight: tileset.h,
      imagewidth: tileset.w,
      margin: 0,
      name: "tileset",
      spacing: 0,
      tilecount: COLUMNAS * 4,
      tileheight: T,
      tiles: [
        ...colisionable,
        figura(24, "cuadrado", "#3fa7f5"),
        figura(25, "triangulo", "#5ad15a"),
        figura(26, "rombo", "#ffc93c"),
      ],
      tilewidth: T,
    },
  ],
  tilewidth: T,
  type: "map",
  version: "1.10",
  width: ANCHO,
};

writeFileSync(ruta("tilemap/map.json"), JSON.stringify(mapa, null, 1));

console.log("Assets generados en public/assets/");
