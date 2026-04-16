/**
 * TRIDENT MULTI-MODE — STATE MACHINE
 * Manages layer transitions for Trident Brain modes.
 */

import type { LayerConfig } from './types.js';

export interface TridentState {
  currentLayer: number;
  iteration: string;
  layerAttempts: number;
  status: 'IDLE' | 'LAYER_IN_PROGRESS' | 'LAYER_COMPLETE' | 'COMPLETE';
  startedAt?: Date;
  completedLayers: number[];
}

export interface LayerTransition {
  from: number;
  to: number;
  timestamp: Date;
  successful: boolean;
}

export class StateMachine {
  private layers: LayerConfig[];
  private state: TridentState;
  private transitionHistory: LayerTransition[] = [];

  constructor(layers: LayerConfig[]) {
    this.layers = layers;
    this.state = {
      currentLayer: 0,
      iteration: 'V1.0',
      layerAttempts: 0,
      status: 'IDLE',
      completedLayers: []
    };
  }

  getState(): TridentState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.status === 'IDLE') {
      this.state.currentLayer = 1;
      this.state.startedAt = new Date();
      this.state.status = 'LAYER_IN_PROGRESS';
    }
  }

  completeLayer(): boolean {
    if (this.state.status === 'COMPLETE') return false;

    const currentLayerConfig = this.layers.find(l => l.number === this.state.currentLayer);
    if (!currentLayerConfig) return false;

    if (!this.state.completedLayers.includes(this.state.currentLayer)) {
      this.state.completedLayers.push(this.state.currentLayer);
    }

    this.transitionHistory.push({
      from: this.state.currentLayer,
      to: this.state.currentLayer + 1,
      timestamp: new Date(),
      successful: true
    });

    if (this.state.currentLayer >= this.layers.length) {
      this.state.status = 'COMPLETE';
      return false;
    }

    this.state.currentLayer++;
    this.state.layerAttempts = 0;
    this.state.status = 'LAYER_IN_PROGRESS';

    return true;
  }

  failLayer(reason: string): void {
    this.state.layerAttempts++;
    console.error(`[StateMachine] Layer ${this.state.currentLayer} failed: ${reason}`);
  }

  reset(): void {
    this.state = {
      currentLayer: 0,
      iteration: this.incrementIteration(this.state.iteration),
      layerAttempts: 0,
      status: 'IDLE',
      completedLayers: []
    };
  }

  getLayerConfig(layerNumber: number): LayerConfig | undefined {
    return this.layers.find(l => l.number === layerNumber);
  }

  getCurrentLayerConfig(): LayerConfig | undefined {
    return this.getLayerConfig(this.state.currentLayer);
  }

  getAllLayers(): LayerConfig[] {
    return [...this.layers];
  }

  isComplete(): boolean {
    return this.state.status === 'COMPLETE';
  }

  private incrementIteration(current: string): string {
    const match = current.match(/^V(\d+)\.(\d+)$/);
    if (match) {
      return `V${parseInt(match[1])}.${parseInt(match[2]) + 1}`;
    }
    return 'V1.1';
  }
}