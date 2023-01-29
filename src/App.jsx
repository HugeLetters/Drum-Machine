import React from 'react';
import SoundPadGrid from "./SoundPadGrid";
import SettingsPanel from './SettingsPanel';
import Recorder from './Recorder';
import audioManifest from './audioManifest.json';
export default class App extends React.Component {
  render() {
    return <>
      <Background />
      <DrumMachine />
    </>
  }
}

class DrumMachine extends React.Component {
  constructor(props) {
    super(props);
    this.presets = audioManifest.presets;
    this.state = { power: false, preset: this.presets[0], currentTrack: "" };
    this.audioContext = new window.AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }
  handlePowerSwitch = (power) => this.setState({ power });
  handlePreset = (preset) => this.setState({ preset });
  handlePlay = ({ buffer, key, filename }) => {
    const event = new CustomEvent("samplePlayed", { detail: { filename, buffer, key, preset: this.state.preset } });
    document.dispatchEvent(event);
  };
  render() {
    return <div id="drumMachine">
      <Recorder
        audio={{
          context: this.audioContext,
          node: this.gainNode,
          power: this.state.power,
        }}
        presets={this.presets} />
      <SoundPadGrid
        audio={{
          context: this.audioContext,
          node: this.gainNode,
          power: this.state.power,
          preset: this.state.preset
        }}
        handlePlay={this.handlePlay}
      />
      <SettingsPanel
        audio={{
          node: this.gainNode
        }}
        handlePowerSwitch={this.handlePowerSwitch}
        handlePreset={this.handlePreset}
        presets={this.presets}
        preset={this.state.preset} />
    </div>
  }
}

class Background extends React.Component {
  render() {
    return <div id="background"></div>
  }
}