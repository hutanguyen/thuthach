// soundEngine.ts - Bộ máy phát nhạc nền Web Audio API phong cách Thám Hiểm Vui Nhộn, Bắt Tai
// (Catchy Jungle & Island Adventure / Nintendo & Crash Bandicoot style)
// Đặc trưng: Nhịp gõ Bongo rộn rã, Marimba nảy tưng bừng, Bassline bước nhảy vui tươi, tiếng sáo thám hiểm bắt tai và kèn hiệu hào hứng.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private step: number = 0;
  private tempo: number = 124; // 124 BPM: Nhịp phiêu lưu vui nhộn, rộn ràng, cực kỳ bắt tai
  private listeners: Set<(isPlaying: boolean) => void> = new Set();

  // Bảng nốt nhạc chuẩn tần số (Hz)
  private readonly NOTES: Record<string, number> = {
    // Bass (Octave 2 - 3)
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    // Mid / Chords (Octave 4)
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    // Marimba & Melodic Hook (Octave 5)
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    // High Hook & Sparkles (Octave 6)
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98,
  };

  // 1. Mẫu BASSLINE bước nhảy thám hiểm cực vui (Bouncy Walking Adventure Bass) - 64 bước
  // C major -> F major -> G major -> C (Am) lặp tuần hoàn bắt tai
  private readonly BASS_PATTERN = [
    // Bar 1: C Major (Khởi hành rộn ràng)
    'C3', '', 'C3', 'G2', '', 'C3', 'E3', '', 'G2', '', 'C3', '', 'E3', '', 'G3', '',
    // Bar 2: F Major (Vượt rừng xanh kỳ thú)
    'F2', '', 'F3', 'C3', '', 'F2', 'A2', '', 'C3', '', 'F3', '', 'A2', '', 'C3', '',
    // Bar 3: G Major (Băng qua thác nước)
    'G2', '', 'G3', 'D3', '', 'G2', 'B2', '', 'D3', '', 'G3', '', 'F3', '', 'E3', '',
    // Bar 4: C -> G7 Turnaround (Tiến về đích)
    'C3', '', 'E3', '', 'G3', '', 'C4', '', 'G2', '', 'B2', '', 'D3', '', 'G3', '',
  ];

  // 2. Mẫu MARIMBA phiến gỗ nhảy múa (Bouncy Island Marimba Ostinato)
  private readonly MARIMBA_PATTERN = [
    // Bar 1
    'C4', 'E4', 'G4', 'C5', '', 'G4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4', 'G4', 'C5', '',
    // Bar 2
    'C4', 'F4', 'A4', 'C5', '', 'A4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4', 'F4', 'A4', 'C5', '',
    // Bar 3
    'D4', 'G4', 'B4', 'D5', '', 'B4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4', 'G4', 'B4', 'D5', '',
    // Bar 4
    'E4', 'G4', 'C5', 'E5', '', 'C5', 'G4', 'E4', 'D4', 'G4', 'B4', 'D5', 'C5', '', '', '',
  ];

  // 3. GIAI ĐIỆU CHÍNH (Lead Adventure Whistle & Brass Hook) - Bắt tai, vui vẻ, tươi sáng
  private readonly LEAD_PATTERN = [
    // Bar 1: Giai điệu mở đầu rộn ràng
    'G4', '', 'C5', '', 'E5', '', 'G5', '', 'F5', 'E5', 'D5', '', 'C5', '', '', '',
    // Bar 2: Lượn sóng vui tươi
    'A4', '', 'D5', '', 'F5', '', 'A5', '', 'G5', 'E5', 'C5', '', 'D5', '', '', '',
    // Bar 3: Bước nhảy hào hứng lên nốt cao
    'E5', 'F5', 'G5', '', 'C6', '', 'B5', '', 'A5', '', 'G5', '', 'E5', '', '', '',
    // Bar 4: Điểm nhấn về đích bắt tai
    'F5', '', 'G5', '', 'A5', '', 'B5', '', 'C6', '', 'G5', '', 'C5', '', '', '',
  ];

  // 4. Kèn Horn / Ukulele Stabs (Hợp âm nảy trên phách nghịch, tạo độ nhún nhảy cuốn hút)
  private readonly CHORD_PATTERN = [
    // Bar 1: C Major offbeats
    '', 'C4', '', 'C4', '', 'C4', '', 'C4', '', 'C4', '', 'C4', '', 'C4', '', 'C4',
    // Bar 2: F Major offbeats
    '', 'F4', '', 'F4', '', 'F4', '', 'F4', '', 'F4', '', 'F4', '', 'F4', '', 'F4',
    // Bar 3: G Major offbeats
    '', 'G4', '', 'G4', '', 'G4', '', 'G4', '', 'G4', '', 'G4', '', 'G4', '', 'G4',
    // Bar 4: C & G offbeats
    '', 'C4', '', 'C4', '', 'C4', '', 'C4', '', 'G4', '', 'G4', '', 'C5', '', '',
  ];

  constructor() {
    try {
      const saved = localStorage.getItem('quiz_sound_enabled');
      this.isMuted = saved !== 'true';
    } catch {
      this.isMuted = true;
    }
  }

  public subscribe(cb: (isPlaying: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(!this.isMuted && this.isPlaying);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const active = !this.isMuted && this.isPlaying;
    this.listeners.forEach(cb => cb(active));
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain: Âm lượng ấm áp, dễ chịu, không lấn át giao diện
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Trống Bass nảy (Bouncy Acoustic Kick Drum)
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // 2. Trống Bongo rừng xanh (High & Low Bongo - tạo độ lắc lư thám hiểm)
  private playBongo(time: number, isHigh: boolean = true) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = isHigh ? 380 : 230;
    const endFreq = isHigh ? 240 : 150;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHigh ? 420 : 260, time);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // 3. Mõ gõ gỗ / Claves vui tai (Crisp Woodblock / Rimshot)
  private playClaves(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.value = 6;

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  // 4. Shaker rộn ràng (Tropical Jungle Shaker)
  private playShaker(time: number, isAccent: boolean = false) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = isAccent ? 4800 : 7200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isAccent ? 0.15 : 0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // 5. Slap / Walking Adventure Bass nảy tưng bừng
  private playBouncyBass(note: string, time: number) {
    if (!this.ctx || !this.masterGain || !this.NOTES[note]) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.NOTES[note], time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + 0.18);

    gain.gain.setValueAtTime(0.36, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // 6. Marimba phiến gỗ ròn rã (Bouncy Marimba)
  private playMarimba(note: string, time: number) {
    if (!this.ctx || !this.masterGain || !this.NOTES[note]) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.NOTES[note], time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // 7. Giai điệu Sáo Thám Hiểm siêu bắt tai (Catchy Adventure Lead Whistle)
  private playLead(note: string, time: number) {
    if (!this.ctx || !this.masterGain || !this.NOTES[note]) return;
    const osc = this.ctx.createOscillator();
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Rung nhẹ ngọt ngào tạo chất sáo phiêu lưu
    vibrato.frequency.setValueAtTime(6.0, time);
    vibratoGain.gain.setValueAtTime(3.5, time);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.NOTES[note], time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + 0.35);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    vibrato.start(time);
    osc.start(time);
    vibrato.stop(time + 0.4);
    osc.stop(time + 0.4);
  }

  // 8. Hợp âm kèn / đàn gảy nảy nhịp (Adventure Ukulele / Horn Stabs)
  private playChordStab(note: string, time: number) {
    if (!this.ctx || !this.masterGain || !this.NOTES[note]) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(this.NOTES[note], time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.frequency.exponentialRampToValueAtTime(450, time + 0.12);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  // Bộ lập lịch phát nốt nhạc
  private scheduleTick() {
    if (!this.ctx || !this.isPlaying || this.isMuted) return;

    const currentTime = this.ctx.currentTime;
    const stepDuration = 60 / this.tempo / 4; // 1/16th note
    const playTime = currentTime + 0.04;

    const bassStep = this.step % this.BASS_PATTERN.length;
    const marimbaStep = this.step % this.MARIMBA_PATTERN.length;
    const leadStep = this.step % this.LEAD_PATTERN.length;
    const chordStep = this.step % this.CHORD_PATTERN.length;

    // 1. Bộ gõ thám hiểm vui nhộn:
    // Kick ở phách 1 và 3 (bước 0, 8 của ô nhịp 16)
    if (this.step % 8 === 0) {
      this.playKick(playTime);
    }
    // Claves / Mõ gõ ở phách 2 và 4 (bước 4, 12)
    if (this.step % 8 === 4) {
      this.playClaves(playTime);
    }
    // Trống Bongo rừng xanh đảo phách (bước 2, 6, 11, 14)
    if (this.step % 16 === 2 || this.step % 16 === 11) {
      this.playBongo(playTime, true);
    } else if (this.step % 16 === 6 || this.step % 16 === 14) {
      this.playBongo(playTime, false);
    }
    // Shaker nhịp đôi
    if (this.step % 2 === 0) {
      this.playShaker(playTime, this.step % 4 === 2);
    }

    // 2. Bass bước nhảy
    const bassNote = this.BASS_PATTERN[bassStep];
    if (bassNote) {
      this.playBouncyBass(bassNote, playTime);
    }

    // 3. Hợp âm kèn nảy phách nghịch (Offbeats)
    const chordNote = this.CHORD_PATTERN[chordStep];
    if (chordNote) {
      this.playChordStab(chordNote, playTime);
    }

    // 4. Marimba vui tai
    const marimbaNote = this.MARIMBA_PATTERN[marimbaStep];
    if (marimbaNote) {
      this.playMarimba(marimbaNote, playTime);
    }

    // 5. Giai điệu sáo phiêu lưu bắt tai
    const leadNote = this.LEAD_PATTERN[leadStep];
    if (leadNote) {
      this.playLead(leadNote, playTime);
    }

    this.step = (this.step + 1) % 64;

    const ms = stepDuration * 1000;
    this.timerId = window.setTimeout(() => this.scheduleTick(), ms);
  }

  // Âm thanh bật nhạc vui nhộn (Upbeat Discovery Chime)
  public playDiscoveryChime() {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    // Chuỗi 5 nốt vui tươi rộn rã: C5 -> E5 -> G5 -> B5 -> C6
    const chords = [523.25, 659.25, 783.99, 987.77, 1046.50];
    const startTime = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.07);

      gain.gain.setValueAtTime(0.24, startTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime + idx * 0.07);
      osc.stop(startTime + idx * 0.07 + 0.32);
    });
  }

  // Âm thanh kèn chúc mừng chiến thắng hoành tráng (Victory Fanfare) khi hoàn thành bài
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const startTime = this.ctx.currentTime;
    // Chuỗi hợp âm kèn fanfare chiến thắng: C5 -> E5 -> G5 -> C6 ngân dài rạng rỡ
    const notes = [
      { f: 523.25, t: 0, d: 0.12 },
      { f: 523.25, t: 0.13, d: 0.12 },
      { f: 523.25, t: 0.26, d: 0.12 },
      { f: 659.25, t: 0.39, d: 0.35 },
      { f: 587.33, t: 0.75, d: 0.12 },
      { f: 659.25, t: 0.88, d: 0.15 },
      { f: 783.99, t: 1.05, d: 0.6 },
      { f: 1046.50, t: 1.4, d: 0.9 },
    ];

    notes.forEach(n => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, startTime + n.t);

      gain.gain.setValueAtTime(0.22, startTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime + n.t);
      osc.stop(startTime + n.t + n.d + 0.05);
    });
  }

  // Âm thanh cảnh báo hết giờ làm bài (Time's Up Alert)
  public playTimeUpAlert() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const startTime = this.ctx.currentTime;
    // Chuỗi 3 tiếng chuông rõ ràng: A4 -> F4 -> D4
    const notes = [
      { f: 440.00, t: 0, d: 0.22 },
      { f: 349.23, t: 0.22, d: 0.25 },
      { f: 293.66, t: 0.48, d: 0.65 },
    ];

    notes.forEach(n => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, startTime + n.t);

      gain.gain.setValueAtTime(0.28, startTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime + n.t);
      osc.stop(startTime + n.t + n.d + 0.05);
    });
  }

  // Tiếng tích tắc đếm ngược khẩn cấp (Urgent Tick)
  public playUrgentTick() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    const startTime = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, startTime);
    osc.frequency.exponentialRampToValueAtTime(440, startTime + 0.06);

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.07);
  }

  public start() {
    this.initAudio();
    if (this.isMuted) return;

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.step = 0;
      this.scheduleTick();
      this.notify();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public toggle(): boolean {
    this.initAudio();
    if (this.isMuted) {
      this.isMuted = false;
      try {
        localStorage.setItem('quiz_sound_enabled', 'true');
      } catch {}
      this.playDiscoveryChime();
      this.start();
      return true;
    } else {
      this.isMuted = true;
      try {
        localStorage.setItem('quiz_sound_enabled', 'false');
      } catch {}
      this.stop();
      return false;
    }
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
