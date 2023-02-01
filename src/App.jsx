import React, { useEffect, useRef } from 'react';
import SoundPadGrid from "./SoundPadGrid";
import SettingsPanel from './SettingsPanel';
import Recorder from './Recorder';
import audioManifest from './audioManifest.json';
import { randomInt } from './utils';
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.drumMachineRef = React.createRef();
  }
  getSize = () => this.drumMachineRef.current.drumMachineRef.current.getBoundingClientRect();
  render() {
    return <>
      <Background getAvoidArea={this.getSize} />
      <DrumMachine ref={this.drumMachineRef} />
    </>
  }
}

class DrumMachine extends React.Component {
  constructor(props) {
    super(props);
    this.presets = audioManifest.presets;
    this.state = { power: false, preset: this.presets[0], currentTrack: "" };
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.drumMachineRef = React.createRef();
  }
  handlePowerSwitch = (power) => this.setState({ power });
  handlePreset = (preset) => this.setState({ preset });
  handlePlay = ({ buffer, key, filename }) => {
    const event = new CustomEvent("samplePlayed", { detail: { filename, buffer, key, preset: this.state.preset } });
    document.dispatchEvent(event);
  };
  render() {
    return <div id="drumMachine" ref={this.drumMachineRef}>
      <Recorder
        audio={{
          context: this.audioContext,
          node: this.gainNode,
          power: this.state.power,
        }}
        preset={this.state.preset}
        presets={this.presets} />
      <div id="bottomContainer">
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
    </div>
  }
}

function Background(props) {

  const canvas = useRef();
  const notes = ["♩", "♪", "♫", "♬", "♭", "♮", "♯", "𝄞", "𝄡", "𝄢", "𝄫", "𓏢"];
  const randomColor = () => `hsl(${randomInt(0, 359)},100%,50%)`;
  const randomNote = () => notes[randomInt(0, notes.length - 1)];

  const showNote = ({ detail: { key } }, context) => {
    const { top: xTop, left: xLeft, right: xRight, bottom: xBottom } = props.getAvoidArea();
    const color = randomColor();
    context.textAlign = "center";
    context.strokeStyle = color;
    context.fillStyle = color;
    const { innerWidth: width, innerHeight: height } = window;
    const boxSize = Math.floor(width / 30);
    context.font = `bold ${boxSize}px serif`;
    let [x, y] = [randomInt(0, width), randomInt(0, height)];
    while (x >= xLeft && x <= (xRight - boxSize) && y >= xTop && y <= (xBottom - boxSize)) {
      [x, y] = [randomInt(0, width), randomInt(0, height)];
    }
    context.strokeRect(x, y, boxSize, boxSize);
    context.fillText(randomNote(), x + boxSize / 2, y + 0.8 * boxSize);
  }

  useEffect(() => {
    const context = canvas.current.getContext("2d");
    const { innerWidth: width, innerHeight: height } = window;
    canvas.current.width = width;
    canvas.current.height = height;
    const provideContext = (e) => showNote(e, context);
    document.addEventListener("samplePlayed", provideContext);
    return () => document.removeEventListener("samplePlayed", provideContext);
  })

  return <canvas ref={canvas} id="background"></canvas>

}