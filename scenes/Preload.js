// Carga todos los assets una sola vez y arranca el menu

export const SONIDOS = ["recolectar", "malo", "rebote", "salto", "ganar", "perder", "click"];

export default class Preload extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    const { width, height } = this.scale;
    const barra = this.add.rectangle(width / 2 - 200, height / 2, 0, 20, 0xffd93b).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 404, 24).setStrokeStyle(2, 0xffffff);
    this.load.on("progress", (valor) => (barra.width = 400 * valor));

    this.load.tilemapTiledJSON("map", "public/assets/tilemap/map.json");
    this.load.image("tileset", "public/assets/tileset.png");
    // el mismo tileset como spritesheet, para usar las figuras como sprites
    this.load.spritesheet("tiles", "public/assets/tileset.png", {
      frameWidth: 24,
      frameHeight: 24,
    });
    this.load.spritesheet("ninja", "public/assets/ninja.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    SONIDOS.forEach((nombre) => this.load.audio(nombre, `public/assets/sonidos/${nombre}.wav`));
  }

  create() {
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("ninja", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "ninja", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("ninja", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.scene.start("menu");
  }
}
