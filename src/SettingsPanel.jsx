import React from "react";

export default class SettingsPanel extends React.Component {
    handleSwitch = (power) => {
        this.handleDisplay(`POWER:${power ? "ON" : "OFF"}`);
        this.props.handlePowerSwitch(power);
    }
    handleVolume = (volume) => {
        this.handleDisplay(`VOLUME:${(volume * 100).toFixed().padStart(3, 0)}%`);
    }
    handlePreset = (preset) => {
        this.handleDisplay(preset)
        this.props.handlePreset(preset);
    }
    handlePlay = ({ detail: { filename } }) => {
        this.handleDisplay(filename.replace(/(.*\/)|(\..*)/g, ""));
    }
    handleDisplay = (text) => {
        const event = new CustomEvent("userInteracted", { detail: { text } });
        document.dispatchEvent(event);
    }
    componentDidMount() {
        document.addEventListener("samplePlayed", this.handlePlay);
    }
    componentWillUnmount() {
        document.removeEventListener("samplePlayed", this.handlePlay);
    }
    render() {
        return <div id="settingsPanel">
            <PowerSwitch handleSwitch={this.handleSwitch} />
            <Display defaultDisplay={this.props.preset} />
            <VolumeSlider
                node={this.props.audio.node}
                handleVolume={this.handleVolume} />
            <PresetSwitch
                presets={this.props.presets}
                handlePreset={this.handlePreset} />
        </div>
    }
}

class PowerSwitch extends React.Component {
    constructor(props) {
        super(props);
        this.defValue = true;
        this.props.handleSwitch(this.defValue);
    }
    handleChange = (e) => this.props.handleSwitch(e.target.checked);
    render() {
        return <label id="powerSwitch">POWER
            <input type="checkbox" onChange={this.handleChange} defaultChecked={this.defValue} />
            <div className="switch"><span>ON</span><span>OFF</span></div>
        </label>
    }
}
class Display extends React.Component {
    constructor(props) {
        super(props);
        this.state = { display: this.props.defaultDisplay };
        this.timeoutID = -1;
    }
    handleDisplay = ({ detail: { text } }) => {
        this.setState({ display: text });
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(() => {
            this.setState({ display: this.props.defaultDisplay });
        }, 500);
    }
    componentDidMount() {
        document.addEventListener("userInteracted", this.handleDisplay);
    }
    componentWillUnmount() {
        document.removeEventListener("userInteracted", this.handleDisplay);
    }
    render() {
        const displayText = this.state.display.toUpperCase();
        return <div id="display">{displayText}</div>
    }
}
class VolumeSlider extends React.Component {
    constructor(props) {
        super(props);
        this.defVolume = 0.05;
        this.props.node.gain.value = this.defVolume;
        this.props.handleVolume(this.defVolume)
    }
    handleChange = (e) => {
        this.props.node.gain.value = e.target.value / 100;
        this.props.handleVolume(e.target.value / 100);
    }
    render() {
        return <label id="volumeSlider">VOLUME
            <input type="range" onChange={this.handleChange} defaultValue={this.defVolume * 100} />
        </label>
    }
}
class PresetSwitch extends React.Component {
    constructor(props) {
        super(props);
        this.state = { preset: this.props.presets[0] };
        this.props.handlePreset(this.state.preset);
    }
    preventAlphaKeys = (e) => { if (e.keyCode >= 65 && e.keyCode <= 90) e.preventDefault() };
    handleChange = (e) => { this.props.handlePreset(e.target.value); }
    render() {
        return <label id="presetMenu">PRESET
            <select onChange={this.handleChange} onKeyDown={this.preventAlphaKeys} defaultValue={this.state.preset}>
                {this.props.presets.map((preset, i) =>
                    <option key={preset}>{preset}</option>)}
            </select>
        </label>
    }
}