class Power {
  constructor(name, effect) {
    this.name = name;
    this.effect = effect;
  }

  activatePower(applyEffect) {
    // Llama a la función `effect` con los argumentos necesarios
    applyEffect(); // Aquí no pasas más argumentos, solo llamas a la función
  }
}

// Define el poder de reducir el tamaño del pájaro
const shrinkBird = new Power('Shrink Bird', (setBirdSize, birdWidth, birdHeight) => {
  setBirdSize({ width: birdWidth * 0.7, height: birdHeight * 0.7 });
});

export { shrinkBird };
