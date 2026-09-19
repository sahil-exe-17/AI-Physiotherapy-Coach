export class VoiceService {
  private static instance: VoiceService | null = null;
  private synth: SpeechSynthesis | null = null;
  private enabled: boolean = true;
  private volume: number = 0.8;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private cooldownMs: number = 2500; // 2.5 second speech cooldown

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public speak(text: string, force: boolean = false): void {
    if (!this.enabled || !this.synth) return;

    const now = Date.now();

    // Avoid repeating same phrase continuously unless forced or cooldown passed
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < this.cooldownMs) {
      return;
    }

    // Cancel ongoing speech if forcing or if message is important
    if (force || this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = this.volume;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    this.synth.speak(utterance);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
