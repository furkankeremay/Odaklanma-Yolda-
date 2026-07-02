import { useState, useRef, useEffect } from "react";

export interface ChannelStates {
  binaural: boolean;
  lofi: boolean;
  brownnoise: boolean;
  rain: boolean;
}

export interface ChannelVolumes {
  binaural: number;
  lofi: number;
  brownnoise: number;
  rain: number;
}

export function useSoundSynth() {
  const [activeChannels, setActiveChannels] = useState<ChannelStates>({
    binaural: false,
    lofi: false,
    brownnoise: false,
    rain: false,
  });

  const [channelVolumes, setChannelVolumes] = useState<ChannelVolumes>({
    binaural: 0.5,
    lofi: 0.5,
    brownnoise: 0.5,
    rain: 0.5,
  });

  // Main Volume (Master volume for whichever sound is active)
  const [volume, setVolume] = useState<number>(0.8);

  // Web Audio Nodes references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  
  // Track active channels and their audio nodes
  const channelsRef = useRef<{
    [key: string]: {
      sources: any[];
      modulators: any[];
      gainNode: GainNode;
      filter?: BiquadFilterNode;
    };
  }>({});

  // Setup main context & main gain control
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      
      const ctx = new AudioCtx();
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(volume, ctx.currentTime);
      mainGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      mainGainRef.current = mainGain;
    }
    
    // Resume context if suspended
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return true;
  };

  // Noise Buffer creation
  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of loopable noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const startChannel = (channel: keyof ChannelStates) => {
    if (!initAudio()) return;
    const ctx = audioCtxRef.current!;
    
    // Stop if already running to prevent double playing
    stopChannel(channel);

    const channelGain = ctx.createGain();
    const chanVol = channelVolumes[channel];
    channelGain.gain.setValueAtTime(chanVol, ctx.currentTime);
    channelGain.connect(mainGainRef.current || ctx.destination);

    const sources: any[] = [];
    const modulators: any[] = [];
    let customFilter: BiquadFilterNode | undefined = undefined;

    if (channel === "brownnoise") {
      // Procedural Genuine Deep Brown Noise (Uçak kabini uğultusu / Statik Maskeleyici)
      const noiseSrc = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 4.5; // Gain boost for deep presence
      }
      noiseSrc.buffer = buffer;
      noiseSrc.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(250, ctx.currentTime); // 250Hz low rumble

      noiseSrc.connect(lowpass);
      lowpass.connect(channelGain);
      
      noiseSrc.start(0);
      sources.push(noiseSrc);

    } else if (channel === "rain") {
      // Rain drops and fluid flow
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = createNoiseBuffer(ctx);
      noiseSrc.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(600, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(80, ctx.currentTime);

      const sizzleFilter = ctx.createBiquadFilter();
      sizzleFilter.type = "peaking";
      sizzleFilter.frequency.setValueAtTime(3200, ctx.currentTime);
      sizzleFilter.Q.setValueAtTime(1.5, ctx.currentTime);
      sizzleFilter.gain.setValueAtTime(5.0, ctx.currentTime);

      noiseSrc.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(sizzleFilter);
      sizzleFilter.connect(channelGain);

      noiseSrc.start(0);
      sources.push(noiseSrc);

    } else if (channel === "binaural") {
      // 40Hz Binaural Beats Ambient - Sol kulak: 150Hz, Sağ kulak: 190Hz
      const oscL = ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.setValueAtTime(150, ctx.currentTime);
      
      const pannerL = (ctx as any).createStereoPanner ? (ctx as any).createStereoPanner() : null;
      if (pannerL) {
        pannerL.pan.setValueAtTime(-1, ctx.currentTime);
        oscL.connect(pannerL);
        pannerL.connect(channelGain);
      } else {
        oscL.connect(channelGain);
      }
      
      const oscR = ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(190, ctx.currentTime);
      
      const pannerR = (ctx as any).createStereoPanner ? (ctx as any).createStereoPanner() : null;
      if (pannerR) {
        pannerR.pan.setValueAtTime(1, ctx.currentTime);
        oscR.connect(pannerR);
        pannerR.connect(channelGain);
      } else {
        oscR.connect(channelGain);
      }
      
      // Background focus drone/rumble
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx);
      noise.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(120, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
      
      noise.connect(lp);
      lp.connect(noiseGain);
      noiseGain.connect(channelGain);
      
      oscL.start(0);
      oscR.start(0);
      noise.start(0);
      
      sources.push(oscL, oscR, noise);

    } else if (channel === "lofi") {
      // Procedural warm lo-fi analog tape pad chord progression
      // Synthesize a beautiful soft major 9th progression
      const freqs = [87.31, 110.00, 130.81, 164.81, 196.00]; // F root + A + C + E + G (Fmaj9)
      
      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        // Slow pitch wow & flutter cassette tape LFO wobbles
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12 + Math.random() * 0.08, ctx.currentTime);
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(1.2 + Math.random() * 0.8, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.12 / freqs.length, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(channelGain);

        osc.start(0);
        lfo.start(0);
        
        sources.push(osc);
        modulators.push(lfo);
      });

      // Low pass filter sweep for underwater lofi soundscape
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      const filterLFO = ctx.createOscillator();
      filterLFO.frequency.setValueAtTime(0.04, ctx.currentTime);

      const filterLFOGain = ctx.createGain();
      filterLFOGain.gain.setValueAtTime(80, ctx.currentTime);

      filterLFO.connect(filterLFOGain);
      filterLFOGain.connect(filter.frequency);

      channelGain.disconnect();
      channelGain.connect(filter);
      filter.connect(mainGainRef.current || ctx.destination);

      filterLFO.start(0);
      modulators.push(filterLFO);
      customFilter = filter;
    }

    channelsRef.current[channel] = {
      sources,
      modulators,
      gainNode: channelGain,
      filter: customFilter
    };
  };

  const stopChannel = (channel: keyof ChannelStates) => {
    const entry = channelsRef.current[channel];
    if (entry) {
      entry.sources.forEach((s) => {
        try { s.stop(); } catch (e) {}
      });
      entry.modulators.forEach((m) => {
        try { m.stop(); } catch (e) {}
      });
      try { entry.gainNode.disconnect(); } catch (e) {}
      if (entry.filter) {
        try { entry.filter.disconnect(); } catch (e) {}
      }
      delete channelsRef.current[channel];
    }
  };

  const stopAllAmbiance = () => {
    (Object.keys(activeChannels) as Array<keyof ChannelStates>).forEach((chan) => {
      stopChannel(chan);
    });
    setActiveChannels({
      binaural: false,
      lofi: false,
      brownnoise: false,
      rain: false,
    });
  };

  const setChannelVolume = (channel: keyof ChannelStates, vol: number) => {
    setChannelVolumes((prev) => {
      const updated = { ...prev, [channel]: vol };
      const ctx = audioCtxRef.current;
      const entry = channelsRef.current[channel];
      if (ctx && entry) {
        entry.gainNode.gain.setValueAtTime(vol, ctx.currentTime);
      }
      return updated;
    });
  };

  const handleTogglePlay = (preset: string) => {
    if (preset === "none") {
      stopAllAmbiance();
      return;
    }

    const chan = preset as keyof ChannelStates;
    const wasActive = activeChannels[chan];

    // Radio action logic: stop all other channels first
    (Object.keys(activeChannels) as Array<keyof ChannelStates>).forEach((c) => {
      stopChannel(c);
    });

    if (wasActive) {
      // Toggle off
      setActiveChannels({
        binaural: false,
        lofi: false,
        brownnoise: false,
        rain: false,
      });
    } else {
      // Activate only this channel
      setActiveChannels({
        binaural: chan === "binaural",
        lofi: chan === "lofi",
        brownnoise: chan === "brownnoise",
        rain: chan === "rain",
      });
      startChannel(chan);
    }
  };

  // Adjust master volume when slider changes
  useEffect(() => {
    if (mainGainRef.current && audioCtxRef.current) {
      mainGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      (Object.keys(channelsRef.current) as Array<keyof ChannelStates>).forEach((chan) => {
        const entry = channelsRef.current[chan];
        if (entry) {
          entry.sources.forEach((s) => { try { s.stop(); } catch (e) {} });
          entry.modulators.forEach((m) => { try { m.stop(); } catch (e) {} });
          try { entry.gainNode.disconnect(); } catch (e) {}
          if (entry.filter) {
            try { entry.filter.disconnect(); } catch (e) {}
          }
        }
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Play C5 to A5 glide completing tone
  const playCompletionBell = () => {
    if (!initAudio()) return;
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.3); 

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); 

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(0);
    osc2.start(0);
    osc.stop(ctx.currentTime + 1.3);
    osc2.stop(ctx.currentTime + 1.3);
  };

  const playCozyChirp = () => {
    if (!initAudio()) return;
    const ctx = audioCtxRef.current!;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(0);
    osc.stop(ctx.currentTime + 0.16);
  };

  // Neo-brutalist retro buzzer/school bell sound effect using multi-tone square waves
  const playRetroAlarm = () => {
    if (!initAudio()) return;
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    
    // Play a series of 4 rapid high-quality chiptune alarm pulses to sound like retro school bell / buzzer
    for (let i = 0; i < 4; i++) {
      const startTime = now + i * 0.22;
      
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "square";
      osc.frequency.setValueAtTime(880, startTime); // High pitch A5
      
      subOsc.type = "triangle";
      subOsc.frequency.setValueAtTime(440, startTime); // Middle A4 sub-harmonics
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
      
      osc.connect(gainNode);
      subOsc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      subOsc.start(startTime);
      
      osc.stop(startTime + 0.2);
      subOsc.stop(startTime + 0.2);
    }
  };

  // Backward compatible properties
  const isPlaying = Object.values(activeChannels).some(Boolean);
  const activePreset = isPlaying ? "mixer" : "none";

  return {
    activePreset,
    activeChannels,
    channelVolumes,
    setChannelVolume,
    volume,
    setVolume,
    isPlaying,
    stopAllAmbiance,
    handleTogglePlay,
    playCompletionBell,
    playCozyChirp,
    playRetroAlarm,
  };
}
