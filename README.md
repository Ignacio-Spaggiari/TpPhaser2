# Ninja Moncho

Trabajo Práctico Módulo #1 — Programación 1 (UNRaf). Propuesta 1, hecho con Phaser 3 (sin Vite) y mapas de Tiled.

Enkei Kiiro, el último guerrero del clan ninja Moncho, debe defender su pueblo de una lluvia de asteroides geométricos.

## Cómo jugar

- `←` `→` moverse, `↑` saltar, `R` reiniciar.
- Cada segundo cae un cuadrado, un triángulo o un rombo al azar.
- **Ganás** cuando juntás al menos 2 figuras de cada tipo.

## Cómo correrlo

Abrir `index.html` con un servidor local (por ejemplo Live Server de VS Code, puerto 5501).

## Estructura

- `scenes/Preload.js`: carga de assets y animaciones.
- `scenes/Menu.js`: menú con la premisa, instrucciones y botón Jugar.
- `scenes/Game.js`: escena de juego.
- `public/assets/tilemap/map.json`: mapa de Tiled (capas Fondo, Montanas, Decoracion, Plataformas y Objetos).
- `public/assets/tileset.png`: tileset de 24x24 con el escenario y las figuras.
- `tools/generar-assets.mjs`: script que genera el tileset, el sprite del ninja, los sonidos y el mapa (`node tools/generar-assets.mjs`).

## Uso de Tiled

- Las plataformas colisionan por la propiedad `esColisionable` de sus tiles.
- Las figuras que caen son tiles del tileset con las propiedades `tipo` y `color`.
- En la capa de objetos `Objetos` están el punto de aparición del jugador (`player`) y el rectángulo desde donde caen las figuras (`zonaCaida`).
