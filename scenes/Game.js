// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/
import { texto } from "./ui.js";

const TIEMPO_PARTIDA = 60; // segundos (Mejora 1)
const INTERVALO_CAIDA = 500; // ms entre cada figura (Mejora 3)
const DESCUENTO_REBOTE = 5; // puntos que pierde una figura en cada rebote (Mejora 3)
const PUNTAJE_PARA_GANAR = 100; // hay que superarlo (Mejora 2)
const MINIMO_POR_TIPO = 2;

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
    this.tiempoRestante = TIEMPO_PARTIDA;
    // cada figura recolectada se guarda en este array
    this.recolectados = [];
    this.terminado = false;
  }

  create() {
    const map = this.make.tilemap({ key: "map" });

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("tileset", "tileset");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    map.createLayer("Fondo", tileset, 0, 0);
    map.createLayer("Montanas", tileset, 0, 0);
    map.createLayer("Decoracion", tileset, 0, 0);
    const platformLayer = map.createLayer("Plataformas", tileset, 0, 0);

    // Las figuras se definen en Tiled como tiles del tileset con las propiedades "tipo", "puntos" y "color"
    this.figuras = Object.entries(tileset.tileProperties)
      .filter(([, props]) => props.tipo)
      .map(([id, props]) => ({ frame: Number(id), ...props }));
    this.figurasBuenas = this.figuras.filter((fig) => fig.puntos > 0);
    // las figuras buenas salen el doble de seguido que el asteroide maldito
    this.bolsaDeFiguras = this.figuras.flatMap((fig) => (fig.puntos > 0 ? [fig, fig] : [fig]));

    // Find in the Object Layer, the name "player" and get position
    const spawnPoint = map.findObject("Objetos", (obj) => obj.name === "player");
    this.zonaCaida = map.findObject("Objetos", (obj) => obj.name === "zonaCaida");

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "ninja", 4);
    this.player.setSize(22, 26).setOffset(5, 5);
    this.player.setCollideWorldBounds(true);

    // las figuras caen desde arriba de la pantalla, asi que el borde superior no colisiona
    this.physics.world.setBoundsCollision(true, true, false, true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    platformLayer.setCollisionByProperty({ esColisionable: true });
    this.physics.add.collider(this.player, platformLayer);

    this.items = this.physics.add.group();
    this.physics.add.collider(this.items, platformLayer, this.reboteItem, null, this);
    this.physics.add.overlap(this.player, this.items, this.recolectarItem, null, this);

    // Pasado un segundo empiezan a caer figuras (GDD 6.1)
    this.time.delayedCall(1000, () => {
      this.time.addEvent({ delay: INTERVALO_CAIDA, loop: true, callback: this.crearItem, callbackScope: this });
    });

    this.time.addEvent({ delay: 1000, loop: true, callback: this.descontarTiempo, callbackScope: this });

    this.crearHud();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }

    if (this.terminado) return;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    // solo puede saltar si esta apoyado
    if (this.cursors.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-380);
      this.sound.play("salto", { volume: 0.4 });
    }

    this.items.children.iterate((item) => {
      // cuando deja de tocar el piso, el proximo contacto cuenta como un nuevo rebote
      if (!item.body.blocked.down) item.setData("puedeRebotar", true);
      item.etiqueta.setPosition(item.x, item.y - 20);
    });
  }

  crearHud() {
    const { width } = this.scale;

    // franja de fondo para que las figuras que caen no tapen el HUD
    this.add.rectangle(0, 0, width, 56, 0x1d1b2e, 0.6).setOrigin(0).setDepth(10);
    this.scoreText = texto(this, 16, 12, `Puntos: ${this.score}`).setDepth(10);
    this.timerText = texto(this, width - 16, 12, `⏱ ${this.tiempoRestante}`).setOrigin(1, 0).setDepth(10);

    // contador de cada figura que hace falta para ganar
    this.contadores = {};
    this.figurasBuenas.forEach((fig, i) => {
      const x = width / 2 - 90 + i * 80;
      this.add.image(x, 28, "tiles", fig.frame).setDepth(10);
      this.contadores[fig.tipo] = texto(this, x + 16, 28, `0/${MINIMO_POR_TIPO}`, {
        fontSize: "16px",
        strokeThickness: 4,
      })
        .setOrigin(0, 0.5)
        .setDepth(10);
    });
  }

  crearItem() {
    const fig = Phaser.Utils.Array.GetRandom(this.bolsaDeFiguras);
    const x = Phaser.Math.Between(this.zonaCaida.x, this.zonaCaida.x + this.zonaCaida.width);
    const y = Phaser.Math.Between(this.zonaCaida.y, this.zonaCaida.y + this.zonaCaida.height);

    const item = this.items.create(x, y, "tiles", fig.frame);
    item.setData({ tipo: fig.tipo, puntos: fig.puntos, color: fig.color, puedeRebotar: true });
    item.setBounce(1, 0.75);
    item.setCollideWorldBounds(true);
    item.setVelocityX(Phaser.Math.Between(-60, 60));
    item.setAngularVelocity(Phaser.Math.Between(-90, 90));

    // texto con el valor actual de la figura
    item.etiqueta = texto(this, x, y - 20, fig.puntos, {
      fontSize: "12px",
      color: fig.color,
      strokeThickness: 3,
    }).setOrigin(0.5);
    item.on("destroy", () => item.etiqueta.destroy());
  }

  reboteItem(item) {
    if (!item.body.blocked.down || !item.getData("puedeRebotar")) return;
    item.setData("puedeRebotar", false);

    // en cada rebote la figura vale 5 puntos menos (para el asteroide, 5 puntos menos de castigo)
    const puntos = item.getData("puntos");
    const nuevos = puntos - DESCUENTO_REBOTE * Math.sign(puntos);
    item.setData("puntos", nuevos);
    item.etiqueta.setText(nuevos);

    if (nuevos === 0) {
      this.desaparecerItem(item);
    } else {
      this.sound.play("rebote", { volume: 0.25 });
    }
  }

  desaparecerItem(item) {
    item.disableBody(true, false);
    item.etiqueta.setVisible(false);
    this.tweens.add({
      targets: item,
      alpha: 0,
      scale: 0.2,
      duration: 200,
      onComplete: () => item.destroy(),
    });
  }

  recolectarItem(player, item) {
    const puntos = item.getData("puntos");

    this.recolectados.push(item.getData("tipo"));
    this.score = Math.max(0, this.score + puntos);
    this.scoreText.setText(`Puntos: ${this.score}`);
    this.sound.play(puntos > 0 ? "recolectar" : "malo", { volume: 0.6 });

    if (puntos < 0) this.cameras.main.shake(150, 0.01);
    this.textoFlotante(item.x, item.y, puntos > 0 ? `+${puntos}` : `${puntos}`, item.getData("color"));
    item.destroy();

    this.actualizarContadores();
    this.verificarVictoria();
  }

  textoFlotante(x, y, contenido, color) {
    const t = texto(this, x, y, contenido, { fontSize: "20px", color, strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  contarRecolectados() {
    const conteo = {};
    this.recolectados.forEach((tipo) => (conteo[tipo] = (conteo[tipo] ?? 0) + 1));
    return conteo;
  }

  actualizarContadores() {
    const conteo = this.contarRecolectados();
    this.figurasBuenas.forEach(({ tipo }) => {
      const cantidad = conteo[tipo] ?? 0;
      this.contadores[tipo].setText(`${cantidad}/${MINIMO_POR_TIPO}`);
      this.contadores[tipo].setColor(cantidad >= MINIMO_POR_TIPO ? "#7dff7d" : "#ffffff");
    });
  }

  // Se verifica cada vez que se recolecta una figura
  verificarVictoria() {
    const conteo = this.contarRecolectados();
    const tieneTodasLasFiguras = this.figurasBuenas.every(({ tipo }) => (conteo[tipo] ?? 0) >= MINIMO_POR_TIPO);

    if (tieneTodasLasFiguras && this.score > PUNTAJE_PARA_GANAR) {
      this.terminar(true);
    }
  }

  descontarTiempo() {
    if (this.terminado) return;

    this.tiempoRestante--;
    this.timerText.setText(`⏱ ${this.tiempoRestante}`);
    if (this.tiempoRestante <= 10) this.timerText.setColor("#ff6b6b");

    if (this.tiempoRestante <= 0) {
      this.terminar(false, "¡Se acabó el tiempo!");
    }
  }

  terminar(gano, motivo = "") {
    if (this.terminado) return;
    this.terminado = true;

    this.physics.pause();
    this.time.removeAllEvents();
    this.player.anims.stop();
    this.sound.play(gano ? "ganar" : "perder");

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x1d1b2e, 0.6).setOrigin(0).setDepth(20);
    texto(this, width / 2, height / 2 - 30, gano ? "¡GANASTE!" : "PERDISTE", {
      fontSize: "72px",
      color: gano ? "#ffd93b" : "#ff6b6b",
      strokeThickness: 10,
    })
      .setOrigin(0.5)
      .setDepth(20);
    texto(this, width / 2, height / 2 + 60, `${motivo}\nPuntaje: ${this.score}\nPresioná R para volver a jugar`, {
      fontSize: "20px",
      align: "center",
    })
      .setOrigin(0.5)
      .setDepth(20);
  }
}
