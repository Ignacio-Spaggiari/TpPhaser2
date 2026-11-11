// Helpers de interfaz compartidos entre escenas

export const ESTILO_TEXTO = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fontSize: "24px",
  color: "#ffffff",
  stroke: "#1d1b2e",
  strokeThickness: 6,
};

export function texto(scene, x, y, contenido, estilo = {}) {
  return scene.add.text(x, y, contenido, { ...ESTILO_TEXTO, ...estilo });
}

// Dibuja el mapa de Tiled de fondo (sin colisiones) para menu y fin de juego
export function fondoTiled(scene) {
  const map = scene.make.tilemap({ key: "map" });
  const tileset = map.addTilesetImage("tileset", "tileset");
  ["Fondo", "Montanas", "Decoracion", "Plataformas"].forEach((capa) => map.createLayer(capa, tileset, 0, 0));
  scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x1d1b2e, 0.55).setOrigin(0);
}

export function boton(scene, x, y, etiqueta, accion) {
  const fondo = scene.add.rectangle(x, y, 240, 56, 0xffd93b).setStrokeStyle(4, 0x1d1b2e);
  const txt = texto(scene, x, y, etiqueta, { fontSize: "26px", color: "#1d1b2e", strokeThickness: 0 }).setOrigin(0.5);

  fondo.setInteractive({ useHandCursor: true });
  fondo.on("pointerover", () => fondo.setFillStyle(0xfff0a8));
  fondo.on("pointerout", () => fondo.setFillStyle(0xffd93b));
  fondo.on("pointerdown", () => {
    scene.sound.play("click");
    accion();
  });

  return scene.add.container(0, 0, [fondo, txt]);
}
