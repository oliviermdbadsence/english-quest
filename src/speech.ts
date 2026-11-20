import manifest from "./audio-manifest.json";

const clips: Record<string, string> = manifest;

/** Same key the ElevenLabs manifest was built with. */
export function normKey(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[\s.!?,;:\u2026]+$/, "");
}

let clip: HTMLAudioElement | null = null;
let generation = 0;

function stopClip(): void {
  generation += 1;
  const audio = clip;
  clip = null;
  if (!audio) return;
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  } catch {
    /* ignore */
  }
}

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
  stopClip();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* audio not available */
  }
}

function clipFile(text: string): string | null {
  const file = clips[normKey(text)];
  if (!file || file.includes("/") || file.includes("\\") || !file.endsWith(".mp3")) return null;
  return file;
}

function playClip(file: string): boolean {
  if (typeof Audio === "undefined") return false;
  try {
    const base = import.meta.env.BASE_URL || "/";
    const audio = new Audio(base + "audio/" + file);
    const mine = generation;
    clip = audio;
    void audio.play().then(() => {
      if (generation !== mine) audio.pause();
    }).catch(() => {
      /* playback blocked or missing file */
    });
    return true;
  } catch {
    clip = null;
    return false;
  }
}

function speakWithSynth(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.85;
    const voice = synth.getVoices().find((item) => {
      const lang = item.lang.toLowerCase().replace("_", "-");
      return lang === "en-gb" || lang.startsWith("en-gb-");
    });
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  } catch {
    /* audio not available */
  }
}

/** Play the British clip for this line. Browser en-GB speech is only the backup. */
export function speak(text: string): void {
  stopSpeech();
  if (!text.trim()) return;
  const file = clipFile(text);
  if (file && playClip(file)) return;
  speakWithSynth(text);
}
