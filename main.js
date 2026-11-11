import Preload from "./scenes/Preload.js";
import Menu from "./scenes/Menu.js";
import Game from "./scenes/Game.js";
import GameOver from "./scenes/GameOver.js";

// Create a new Phaser config object
const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 720,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  // List of scenes to load
  // Only the first scene will be shown
  // Remember to import the scene before adding it to the list
  scene: [Preload, Menu, Game, GameOver],
};

// Create a new Phaser game instance
window.game = new Phaser.Game(config);
