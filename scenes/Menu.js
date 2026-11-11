import { boton, fondoTiled, texto } from "./ui.js";

export default class Menu extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width } = this.scale;
    fondoTiled(this);

    texto(this, width / 2, 110, "NINJA MONCHO", { fontSize: "64px", color: "#ffd93b", strokeThickness: 10 }).setOrigin(0.5);

    this.add.sprite(width / 2, 210, "ninja", 4).setScale(3);

    texto(
      this,
      width / 2,
      320,
      "Enkei Kiiro, el último guerrero del clan Moncho,\n" +
        "debe frenar la lluvia de asteroides geométricos\n" +
        "que amenaza a su pueblo.",
      { fontSize: "18px", align: "center", strokeThickness: 4 }
    ).setOrigin(0.5);

    texto(
      this,
      width / 2,
      440,
      "← → moverse    ↑ saltar\n" +
        "Superá los 100 puntos juntando al menos 2 de cada figura\n" +
        "antes de que se acabe el tiempo.\n" +
        "Cada rebote en el piso le resta 5 puntos a la figura.",
      { fontSize: "16px", align: "center", strokeThickness: 4, lineSpacing: 6 }
    ).setOrigin(0.5);

    boton(this, width / 2, 570, "JUGAR", () => this.scene.start("game"));

    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("game"));
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("game"));
  }
}
