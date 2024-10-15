class Powerup {
  constructor(name/*PowerType*/, applyEffectCallback, disableEffectCallback) {
    this.name = name;
    this.applyEffectCallback = applyEffectCallback;
    this.disableEffectCallback = disableEffectCallback;
  }

  activatePower() {
    this.applyEffectCallback()
  }

  disablePower() {
    this.disableEffectCallback()
  }
}

export { Powerup };
