export function primeVoices(): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.getVoices();
    synth.onvoiceschanged = () => {
      synth.getVoices();
    };
  } catch {
    /* audio not available */
  }
}

export function stopSpeech(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* audio not available */
  }
}

/** Speak with a British English voice when the device has one. `lang` stays en-GB either way. */
export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.85;
    const voices = synth.getVoices();
    const v = voices.find((x) => {
      const lang = x.lang.toLowerCase().replace("_", "-");
      return lang === "en-gb" || lang.startsWith("en-gb-");
    });
    if (v) u.voice = v;
    synth.speak(u);
  } catch {
    /* audio not available */
  }
}
