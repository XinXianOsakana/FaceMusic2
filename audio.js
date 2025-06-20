let audioCtx;
let synth, bass;
let drumMachine;

// 音楽的な、データ
const noteToFreq = { 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25 };
const progressions = [
    [ ["C4", "E4", "G4"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"] ],
    [ ["C4", "E4", "G4", "A4"], ["F3", "A3", "C4", "E4"], ["G3", "B3", "D4", "F4"], ["G3", "B3", "D4", "F4"] ]
];
const drumPatterns = [
    { kick: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
    { kick: [1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0], snare: [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], hihat: [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1] }
];

// 楽器の、クラス（設計図）
class Instrument {
    constructor(ctx) { this.audioCtx = ctx; }
    update(params) {}
    silence() {}
}

class Synth extends Instrument {
    constructor(ctx, oscType = 'sawtooth', numVoices = 3) {
        super(ctx);
        this.oscillators = [];
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.gainNode.connect(this.audioCtx.destination);

        for (let i = 0; i < numVoices; i++) {
            const osc = this.audioCtx.createOscillator();
            osc.type = oscType;
            osc.connect(this.gainNode);
            osc.start();
            this.oscillators.push(osc);
        }
    }
    update({ chord, volume }) {
        chord.forEach((note, i) => {
            if (this.oscillators[i] && noteToFreq[note]) {
                this.oscillators[i].frequency.setTargetAtTime(noteToFreq[note], this.audioCtx.currentTime, 0.05);
            }
        });
        this.gainNode.gain.setTargetAtTime(volume, this.audioCtx.currentTime, 0.05);
    }
    silence() { this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.5); }
}

class DrumMachine extends Instrument {
    constructor(ctx, bpm) {
        super(ctx);
        this.bpm = bpm;
        this.currentStep = 0;
        this.buffers = {};
        this.currentPatternIndex = 0;
    }
    async loadSamples() {
        const load = async (url) => {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioCtx.decodeAudioData(arrayBuffer);
        };
        try {
            [this.buffers.kick, this.buffers.snare, this.buffers.hihat] = await Promise.all([
                load('kick.wav'), load('snare.wav'), load('hihat.wav')
            ]);
            console.log("ドラムサンプル、ロード完了。");
        } catch(err) { console.error("ドラムサンプルのロードに失敗！", err); }
    }
    start() {
        const sixteenthNoteTime = (60 / this.bpm) / 4;
        setInterval(() => this.playStep(), sixteenthNoteTime * 1000);
    }
    playStep() {
        if (!this.buffers.kick) return;
        const pattern = drumPatterns[this.currentPatternIndex];
        if (pattern.kick[this.currentStep] === 1) this.playSound(this.buffers.kick);
        if (pattern.snare[this.currentStep] === 1) this.playSound(this.buffers.snare);
        if (pattern.hihat[this.currentStep] === 1) this.playSound(this.buffers.hihat);
        this.currentStep = (this.currentStep + 1) % 16;
    }
    playSound(buffer) {
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start();
    }
    update({ patternIndex }) { this.currentPatternIndex = patternIndex; }
}

// --- 公開する、命令（API） ---
export async function setupAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
    synth = new Synth(audioCtx, 'sawtooth', 3);
    bass = new Synth(audioCtx, 'sine', 1);
    drumMachine = new DrumMachine(audioCtx, 174);
    await drumMachine.loadSamples();
    drumMachine.start();
    return audioCtx;
}

export function updateAudio(params, videoWidth, videoHeight) {
    if (params.p1) {
        const progressionIndex = Math.floor(map(params.p1.box.xMin, 0, videoWidth, 0, chordProgressions.length));
        const activeProgression = chordProgressions[progressionIndex];
        const chordIndex = Math.floor(map(params.p1.box.yMin, 0, videoHeight, 0, activeProgression.length));
        const activeChord = activeProgression[chordIndex];
        const volume = map(params.p1.box.width, 50, 320, 0, 0.7);
        synth.update({ chord: activeChord, volume: volume * 0.5 });
        bass.update({ chord: [activeChord[0]], volume: volume });
    } else {
        silenceAudio();
    }
    if (params.p2) {
        const patternIndex = Math.floor(map(params.p2.box.yMin, 0, videoHeight, 0, drumPatterns.length));
        drumMachine.update({ patternIndex: patternIndex });
    }
}

export function silenceAudio() {
    synth.silence();
    bass.silence();
}

function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
