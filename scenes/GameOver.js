// Escena unica de fin de juego (Mejora 6): sirve tanto para ganar como para perder
import { boton, fondoTiled, texto } from "./ui.js";

export default class GameOver extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  init(data) {
    this.gano = data.gano;
    this.puntaje = data.puntaje;
    this.motivo = data.motivo;
    this.conteo = data.conteo;
    this.figuras = data.figuras;
  }

  create() {
    const { width } = this.scale;
    fondoTiled(this);

    this.sound.play(this.gano ? "ganar" : "perder");

    texto(this, width / 2, 120, this.gano ? "¡GANASTE!" : "PERDISTE", {
      fontSize: "72px",
      color: this.gano ? "#ffd93b" : "#ff6b6b",
      strokeThickness: 10,
    }).setOrigin(0.5);

    const mensaje = this.gano
      ? "Enkei Kiiro detuvo la lluvia de asteroides.\n¡El pueblo Moncho está a salvo!"
      : `${this.motivo}\nLos asteroides arrasaron el pueblo...`;
    texto(this, width / 2, 220, mensaje, { fontSize: "20px", align: "center", strokeThickness: 4 }).setOrigin(0.5);

    const ninja = this.add.sprite(width / 2, 320, "ninja", 4).setScale(3);
    if (this.gano) {
      this.tweens.add({ targets: ninja, y: 290, duration: 300, yoyo: true, repeat: -1, ease: "Sine.easeOut" });
    } else {
      ninja.setTint(0x8888aa).setAngle(90);
    }

    texto(this, width / 2, 410, `Puntaje: ${this.puntaje}`, { fontSize: "40px" }).setOrigin(0.5);

    // figuras juntadas de cada tipo
    this.figuras.forEach((fig, i) => {
      const x = width / 2 - 150 + i * 100;
      this.add.image(x - 14, 470, "tiles", fig.frame).setScale(1.2);
      texto(this, x + 4, 470, `x${this.conteo[fig.tipo] ?? 0}`, { fontSize: "20px", strokeThickness: 4 }).setOrigin(0, 0.5);
    });

    boton(this, width / 2 - 135, 580, "REINTENTAR", () => this.scene.start("game"));
    boton(this, width / 2 + 135, 580, "MENÚ", () => this.scene.start("menu"));

    texto(this, width / 2, 650, "R: reintentar", { fontSize: "14px", strokeThickness: 3 }).setOrigin(0.5);
    this.input.keyboard.once("keydown-R", () => this.scene.start("game"));
  }
}
