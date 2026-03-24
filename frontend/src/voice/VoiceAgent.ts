/**
 * VoiceAgent — Gemini Live API WebSocket client
 *
 * Manages real-time audio conversation with Gemini 2.5 Flash native audio.
 * Handles mic capture, audio playback, echo cancellation, barge-in,
 * and text chat over a single persistent WebSocket.
 */

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface VoiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onUserTranscript: (text: string) => void;
  onAITranscript: (text: string) => void;
  onError: (message: string) => void;
}

export class VoiceAgent {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private state: VoiceState = 'idle';
  private callbacks: VoiceCallbacks;
  private apiKey: string;

  // Playback queue
  private playbackCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private isSpeaking = false;

  // Transcript accumulation — prevents one-word-per-bubble
  private pendingUserTranscript = '';
  private pendingAITranscript = '';
  private userFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private aiFlushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(apiKey: string, callbacks: VoiceCallbacks) {
    this.apiKey = apiKey;
    this.callbacks = callbacks;
  }

  private setState(s: VoiceState) {
    this.state = s;
    this.callbacks.onStateChange(s);
  }

  getState(): VoiceState {
    return this.state;
  }

  /**
   * Start a voice session. Opens WebSocket, starts mic capture.
   */
  async start(): Promise<void> {
    if (this.ws) return;
    this.setState('connecting');

    try {
      // 1. Open WebSocket to Gemini Live API
      const wsUrl = `${WS_BASE}?key=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        this.ws!.onopen = () => {
          console.log('[VoiceAgent] WebSocket connected');
          resolve();
        };
        this.ws!.onerror = (e) => {
          console.error('[VoiceAgent] WebSocket error on connect', e);
          reject(new Error('WebSocket connection failed'));
        };
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
      });

      // 2. Send setup configuration (BidiGenerateContentSetup)
      const setupMsg = {
        setup: {
          model: `models/${MODEL_NAME}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aoede'
                }
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: `You are ECOOPS AI Assistant — an expert in CI/CD pipeline sustainability and optimization. 
You help users understand and optimize their GitLab CI pipelines to reduce wasted compute, save money, and lower carbon emissions.
You are friendly, knowledgeable, and concise. Keep responses brief and conversational since this is a voice interface.
When discussing ECOOPS features, mention: pipeline waste analysis, rules:changes optimization, Green Impact Reports, and CO₂ savings.`
            }]
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      };

      console.log('[VoiceAgent] Sending setup:', JSON.stringify(setupMsg).substring(0, 200));
      this.ws.send(JSON.stringify(setupMsg));

      // 3. Wait for setupComplete from server
      await new Promise<void>((resolve, reject) => {
        const messageHandler = async (event: MessageEvent) => {
          try {
            const text = await this.messageToText(event.data);
            const data = JSON.parse(text);
            console.log('[VoiceAgent] Received:', Object.keys(data));
            if (data.setupComplete !== undefined) {
              console.log('[VoiceAgent] Setup complete!');
              this.ws!.removeEventListener('message', messageHandler);
              resolve();
            }
          } catch (e) {
            console.error('[VoiceAgent] Parse error during setup:', e);
          }
        };
        this.ws!.addEventListener('message', messageHandler);

        // Also handle errors during setup
        this.ws!.onerror = (e) => {
          console.error('[VoiceAgent] WebSocket error during setup', e);
          this.ws!.removeEventListener('message', messageHandler);
          reject(new Error('WebSocket error during setup'));
        };
        this.ws!.onclose = (e) => {
          console.error('[VoiceAgent] WebSocket closed during setup', e.code, e.reason);
          this.ws!.removeEventListener('message', messageHandler);
          reject(new Error(`WebSocket closed during setup: ${e.code} ${e.reason}`));
        };

        // Timeout after 15 seconds
        setTimeout(() => {
          this.ws!.removeEventListener('message', messageHandler);
          reject(new Error('Setup timeout — no setupComplete received'));
        }, 15000);
      });

      // 4. Now set up the permanent message handler
      this.ws.onmessage = (event) => this.handleMessage(event).catch(e => console.error('[VoiceAgent] Handler error:', e));
      this.ws.onclose = (e) => {
        console.log('[VoiceAgent] WebSocket closed:', e.code, e.reason);
        this.setState('idle');
        this.cleanup();
      };
      this.ws.onerror = (e) => {
        console.error('[VoiceAgent] WebSocket error:', e);
        this.callbacks.onError('WebSocket error');
        this.setState('error');
      };

      // 5. Start microphone capture
      await this.startMic();
      this.setState('listening');
      console.log('[VoiceAgent] Now listening!');

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      console.error('[VoiceAgent] Start failed:', msg);
      this.callbacks.onError(msg);
      this.setState('error');
      this.cleanup();
    }
  }

  /**
   * Stop the voice session entirely.
   */
  stop(): void {
    this.cleanup();
    this.setState('idle');
  }

  /**
   * Send a text message through the WebSocket (for chat).
   * Uses clientContent with turnComplete for text input.
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };
    console.log('[VoiceAgent] Sending text:', text);
    this.ws.send(JSON.stringify(msg));
    this.callbacks.onUserTranscript(text);
  }

  // ── Mic Capture ──────────────────────────────────────

  private async startMic(): Promise<void> {
    // Request mic with echo cancellation to prevent AI voice feedback
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1,
      }
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    await this.audioContext.audioWorklet.addModule('/pcm-worklet.js');

    this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

    this.workletNode.port.onmessage = (event) => {
      if (event.data.pcmChunk) {
        this.sendAudioChunk(event.data.pcmChunk);
      }
    };

    this.sourceNode.connect(this.workletNode);
    // Connect to destination so the worklet processes (won't produce audible output)
    this.workletNode.connect(this.audioContext.destination);
    console.log('[VoiceAgent] Mic started, capturing audio');
  }

  private sendAudioChunk(float32Data: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Convert Float32 [-1,1] to Int16 PCM
    const int16 = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Base64 encode
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    // Use the `audio` field (not deprecated `mediaChunks`)
    const msg = {
      realtimeInput: {
        audio: {
          data: b64,
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    };
    this.ws.send(JSON.stringify(msg));
  }

  // ── Blob → text helper (Gemini WS sends Blob, not string) ─

  private async messageToText(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    if (data instanceof Blob) return await data.text();
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
    return String(data);
  }

  // ── Message Handler ──────────────────────────────────

  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const text = await this.messageToText(event.data);
      const response = JSON.parse(text);

      // Log message keys for debugging (skip noisy audio chunks)
      const keys = Object.keys(response);
      if (!keys.includes('serverContent') || 
          (response.serverContent?.modelTurn?.parts?.[0]?.inlineData === undefined)) {
        console.log('[VoiceAgent] Message:', keys, JSON.stringify(response).substring(0, 300));
      }

      if (response.serverContent) {
        const sc = response.serverContent;

        // Audio response from AI
        if (sc.modelTurn?.parts) {
          for (const part of sc.modelTurn.parts) {
            if (part.inlineData) {
              this.playAudioChunk(part.inlineData.data);
              if (!this.isSpeaking) {
                this.isSpeaking = true;
                this.setState('speaking');
              }
            }
            if (part.text) {
              console.log('[VoiceAgent] AI text:', part.text);
              this.callbacks.onAITranscript(part.text);
            }
          }
        }

        // Turn complete — AI finished speaking
        if (sc.turnComplete) {
          console.log('[VoiceAgent] Turn complete');
          // Flush any pending transcripts as complete messages
          this.flushUserTranscript();
          this.flushAITranscript();
          this.isSpeaking = false;
          this.setState('listening');
        }

        // Transcriptions — accumulate instead of emitting each fragment
        if (sc.inputTranscription?.text) {
          this.accumulateUserTranscript(sc.inputTranscription.text);
        }
        if (sc.outputTranscription?.text) {
          this.accumulateAITranscript(sc.outputTranscription.text);
        }
      }

      // Handle tool calls (future use)
      if (response.toolCall) {
        console.log('[VoiceAgent] Tool call:', response.toolCall);
      }
    } catch (e) {
      console.error('[VoiceAgent] Message parse error:', e);
    }
  }

  // ── Transcript Accumulation ──────────────────────────
  // Collects word-by-word fragments into full sentences

  private accumulateUserTranscript(fragment: string): void {
    this.pendingUserTranscript += fragment;
    // Reset flush timer — wait for more fragments
    if (this.userFlushTimer) clearTimeout(this.userFlushTimer);
    this.userFlushTimer = setTimeout(() => this.flushUserTranscript(), 1500);
  }

  private accumulateAITranscript(fragment: string): void {
    this.pendingAITranscript += fragment;
    if (this.aiFlushTimer) clearTimeout(this.aiFlushTimer);
    this.aiFlushTimer = setTimeout(() => this.flushAITranscript(), 1500);
  }

  private flushUserTranscript(): void {
    if (this.userFlushTimer) { clearTimeout(this.userFlushTimer); this.userFlushTimer = null; }
    const text = this.pendingUserTranscript.trim();
    if (text) {
      console.log('[VoiceAgent] User said:', text);
      this.callbacks.onUserTranscript(text);
    }
    this.pendingUserTranscript = '';
  }

  private flushAITranscript(): void {
    if (this.aiFlushTimer) { clearTimeout(this.aiFlushTimer); this.aiFlushTimer = null; }
    const text = this.pendingAITranscript.trim();
    if (text) {
      console.log('[VoiceAgent] AI said:', text);
      this.callbacks.onAITranscript(text);
    }
    this.pendingAITranscript = '';
  }

  // ── Audio Playback ───────────────────────────────────

  private playAudioChunk(base64Data: string): void {
    if (!this.playbackCtx) {
      this.playbackCtx = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackCtx.currentTime;
    }

    // Decode base64 to Int16 PCM
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    // Convert Int16 to Float32 for Web Audio
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    // Schedule playback
    const buffer = this.playbackCtx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackCtx.destination);

    const startTime = Math.max(this.playbackCtx.currentTime, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
  }

  // ── Cleanup ──────────────────────────────────────────

  private cleanup(): void {
    // Flush any pending transcripts before cleanup
    this.flushUserTranscript();
    this.flushAITranscript();

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.playbackCtx) {
      this.playbackCtx.close();
      this.playbackCtx = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isSpeaking = false;
    this.nextPlayTime = 0;
    this.pendingUserTranscript = '';
    this.pendingAITranscript = '';
  }
}
