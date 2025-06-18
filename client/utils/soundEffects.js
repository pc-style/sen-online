// Sound Effects Utility for Sen Online Card Game
class SoundEffects {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  // Resume audio context (needed for Chrome's autoplay policy)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Generate a simple tone
  createTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate white noise for card shuffling effect
  createNoise(duration, filterFreq = 1000) {
    if (!this.enabled || !this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = this.audioContext.createBufferSource();
    whiteNoise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    whiteNoise.start(this.audioContext.currentTime);
    whiteNoise.stop(this.audioContext.currentTime + duration);
  }

  // Card flip sound
  cardFlip() {
    this.resumeAudioContext();
    this.createTone(800, 0.1, 'square');
    setTimeout(() => this.createTone(600, 0.08, 'square'), 50);
  }

  // Card deal sound
  cardDeal() {
    this.resumeAudioContext();
    this.createTone(400, 0.15, 'triangle');
  }

  // Card shuffle sound
  cardShuffle() {
    this.resumeAudioContext();
    this.createNoise(0.8, 2000);
  }

  // Card place sound
  cardPlace() {
    this.resumeAudioContext();
    this.createTone(300, 0.2, 'sine');
  }

  // Button click sound
  buttonClick() {
    this.resumeAudioContext();
    this.createTone(1000, 0.1, 'square');
  }

  // Success sound
  success() {
    this.resumeAudioContext();
    this.createTone(523, 0.2, 'sine'); // C5
    setTimeout(() => this.createTone(659, 0.2, 'sine'), 100); // E5
    setTimeout(() => this.createTone(784, 0.3, 'sine'), 200); // G5
  }

  // Error sound
  error() {
    this.resumeAudioContext();
    this.createTone(200, 0.3, 'sawtooth');
  }

  // Notification sound
  notification() {
    this.resumeAudioContext();
    this.createTone(800, 0.15, 'sine');
    setTimeout(() => this.createTone(1000, 0.15, 'sine'), 150);
  }

  // Game start sound
  gameStart() {
    this.resumeAudioContext();
    const notes = [261, 329, 392, 523]; // C, E, G, C
    notes.forEach((freq, index) => {
      setTimeout(() => this.createTone(freq, 0.3, 'sine'), index * 150);
    });
  }

  // Round end sound
  roundEnd() {
    this.resumeAudioContext();
    this.createTone(392, 0.4, 'sine'); // G
    setTimeout(() => this.createTone(329, 0.4, 'sine'), 200); // E
    setTimeout(() => this.createTone(261, 0.6, 'sine'), 400); // C
  }

  // Toggle sound effects
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Create singleton instance
const soundEffects = new SoundEffects();

export default soundEffects; 