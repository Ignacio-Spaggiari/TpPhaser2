# Ninja Moncho

Trabajo Práctico Módulo #1 — Programación 1 (UNRaf). Propuesta 1, hecho con Phaser 3 (sin Vite) y mapas de Tiled.

Enkei Kiiro, el último guerrero del clan ninja Moncho, debe defender su pueblo de una lluvia de asteroides geométricos.

## Cómo jugar

- `←` `→` moverse, `↑` saltar, `R` reiniciar.
- Caen cuadrados (10 pts), triángulos (15 pts), rombos (20 pts) y asteroides rojos (−15 pts) cada 0,5 segundos.
- Cada rebote en el piso o en una plataforma le resta 5 puntos a la figura; si llega a 0, desaparece.
- **Ganás** si superás los 100 puntos habiendo juntado al menos 2 figuras de cada tipo.
- **Perdés** si se terminan los 60 segundos.

## Cómo correrlo

Abrir `index.html` con un servidor local (por ejemplo Live Server de VS Code, puerto 5501).

## Estructura

- `scenes/Preload.js`: carga de assets y animaciones.
- `scenes/Menu.js`: menú con la premisa, instrucciones y botón Jugar.
- `scenes/Game.js`: escena de juego.
- `scenes/GameOver.js`: escena única de fin de juego (ganar / perder) con el puntaje.
- `public/assets/tilemap/map.json`: mapa de Tiled (capas Fondo, Montanas, Decoracion, Plataformas y Objetos).
- `public/assets/tileset.png`: tileset de 24x24 con el escenario y las figuras.
- `tools/generar-assets.mjs`: script que genera el tileset, el sprite del ninja, los sonidos y el mapa (`node tools/generar-assets.mjs`).

## Uso de Tiled

- La capa `Plataformas` tiene el piso y seis plataformas de madera; colisionan por la propiedad `esColisionable` de sus tiles.
- Las figuras que caen son tiles del tileset con las propiedades `tipo`, `puntos` y `color`: cambiando esos valores en Tiled cambian los puntajes del juego.
- En la capa de objetos `Objetos` están el punto de aparición del jugador (`player`) y el rectángulo desde donde caen las figuras (`zonaCaida`).

## Consigna cumplida

| Mejora | Implementación |
| --- | --- |
| Base | Plataforma inferior, figuras aleatorias cada 1 s, recolectados guardados en un array y victoria verificada al juntar cada uno |
| 1 | Contador descendente de 60 s; al llegar a 0 se pierde |
| 2 | Puntaje distinto por figura; para ganar hay que superar 100 puntos |
| 3 | Intervalo de 0,5 s; cada rebote resta 5 puntos a la figura y a 0 desaparece |
| 4 | Seis plataformas extra en el mapa de Tiled |
| 5 | Asteroide rojo que resta 15 puntos |
| 6 | Escena `GameOver` única para ganar y perder, con texto acorde y puntaje |
