import audioBufferToWav from "audiobuffer-to-wav";
import React from "react";
import { setColorPalette } from "./utils";

export default class Recorder extends React.Component {
    constructor(props) {
        super(props);
        this.state = { recording: true, looping: true }
    }
    handleRecord = () => {
        this.setState((prevState) => ({ recording: !prevState.recording }));
    }
    handleLoop = () => {
        this.setState((prevState) => ({ looping: !prevState.looping }));
    }
    render() {
        return <div id="recorder">
            <TimeLine
                audio={this.props.audio}
                presets={this.props.presets}
                recording={this.state.recording}
                looping={this.state.looping}
            />
            <Controls
                handleRecord={this.handleRecord}
                handleLoop={this.handleLoop}
                recording={this.state.recording}
                looping={this.state.looping}
            />
        </div>
    }
}

class TimeLine extends React.Component {
    constructor(props) {
        super(props);
        this.timelineRef = React.createRef();
        this.length = 1000; // in 0.01s
        this.speed = 10; // in 1ms=0.001s
        this.colors = setColorPalette(this.props.presets);
        this.track = new Map();
        this.state = { time: 0 };
    }
    addSample = ({ detail: { buffer, key, preset } }) => {
        if (!this.props.recording) return null;

        if (!this.track.get(preset)) { this.track.set(preset, {}) }
        const samplesByPreset = this.track.get(preset);
        if (!samplesByPreset[this.state.time]) { samplesByPreset[this.state.time] = [] };
        const sampleQueue = samplesByPreset[this.state.time];
        sampleQueue.push({ buffer, key, time: this.state.time, id: sampleQueue.length });

        if (!this.track.get(this.state.time)) { this.track.set(this.state.time, {}) }
        const samplesByTime = this.track.get(this.state.time);
        if (!samplesByTime[preset]) { samplesByTime[preset] = sampleQueue };

        this.forceUpdate();
    };
    playSample = (tracks) => {
        tracks.forEach(({ buffer }) => {
            const audioTrackInstance = this.props.audio.context.createBufferSource();
            audioTrackInstance.buffer = buffer;
            audioTrackInstance.connect(this.props.audio.node);
            audioTrackInstance.start();
        });
    }
    playTrack = () => {
        this.intervalID = setInterval(() => {
            if (!this.props.looping && this.state.time === this.length - 1) {
                const event = new CustomEvent("loopEnd");
                document.dispatchEvent(event);
            }
            this.setState((state) => ({ time: (state.time + 1) % this.length }));
            const samplesByTime = this.track.get(this.state.time);
            if (samplesByTime) Object.values(samplesByTime).forEach(samples => this.playSample(samples));
        }, this.speed);
    }
    pauseTrack = () => { clearInterval(this.intervalID); }
    handlePlayButton = ({ detail: { action } }) => action ? this.playTrack() : this.pauseTrack();
    handleReset = () => { this.track = new Map(); this.forceUpdate(); };
    moveToClick = (e) => {
        if (e.target !== e.currentTarget) { return null; }
        const x = e.clientX;
        const { left, width } = this.timelineRef.current.getBoundingClientRect();
        this.setState({ time: Math.floor(this.length * ((x - left) / width)) })
    }
    removeStamp = ({ preset, id, time }) => {
        this.track.get(preset)[time].splice(id, 1);
        this.forceUpdate();
    }
    getPercentage = (time) => `${100 * time / this.length}%`;
    handleDownload = () => {
        const sampleRate = 48000;
        const createOffsetBuffer = (buffer, offset) => {
            if (!Math.floor(sampleRate * (offset / 100))) return buffer;
            const prefixBuffer = this.props.audio.context.createBuffer(1, Math.floor(sampleRate * offset / 100), sampleRate);
            const resultBuffer = this.props.audio.context.createBuffer(buffer.numberOfChannels, prefixBuffer.length + buffer.length, sampleRate);
            for (let i = 0; i < resultBuffer.numberOfChannels; i++) {
                const data = resultBuffer.getChannelData(i);
                data.set(prefixBuffer.getChannelData(0));
                data.set(buffer.getChannelData(i), prefixBuffer.length);
            }
            return resultBuffer;
        }
        const offsetBuffers = [];
        let trackLength = Math.floor(sampleRate * this.length / 100);
        this.props.presets.forEach(preset => {
            const buffersByPreset = this.track.get(preset);
            if (!buffersByPreset) return;
            Object.values(buffersByPreset).forEach(buffersByTime => {
                buffersByTime.forEach(({ buffer, time }) => {
                    const offsetBuffer = createOffsetBuffer(buffer, time);
                    trackLength = Math.max(trackLength, offsetBuffer.length);
                    offsetBuffers.push(offsetBuffer);
                })
            })
        })
        if (!offsetBuffers.length) return;
        const offlineContext = new OfflineAudioContext(2, trackLength, sampleRate);
        offsetBuffers.forEach(buffer => {
            const bufferSource = offlineContext.createBufferSource();
            bufferSource.buffer = buffer;
            bufferSource.connect(offlineContext.destination);
            bufferSource.start();
        })
        offlineContext.startRendering().then(buffer => {
            const trackBlob = new window.Blob([new DataView(audioBufferToWav(buffer))], {
                type: 'audio/wav'
            })
            var url = window.URL.createObjectURL(trackBlob)
            const download = document.createElement("a");
            download.download = "Composed Track";
            download.href = url;
            document.body.appendChild(download);
            download.click();
            document.body.removeChild(download);
        })
        return;
    }
    componentDidMount() {
        document.addEventListener("samplePlayed", this.addSample);
        document.addEventListener("recorderPlay", this.handlePlayButton);
        document.addEventListener("recorderReset", this.handleReset);
        document.addEventListener("recorderDownload", this.handleDownload);
    }
    componentWillUnmount() {
        document.removeEventListener("samplePlayed", this.addSample);
        document.removeEventListener("recorderPlay", this.handlePlayButton);
        document.removeEventListener("recorderDownload", this.handleDownload);
    }
    render() {
        return <div id="timeline" ref={this.timelineRef}  >
            <div id="timelinePosition" style={{ left: this.getPercentage(this.state.time) }}></div>
            {this.props.presets.map((preset, i) => {
                const stamps = [];
                Object.values(this.track.get(preset) ?? {}).forEach(samples => stamps.push(...samples))
                return <div
                    className="timelineRow"
                    onClick={this.moveToClick}
                    key={preset}
                    style={{ backgroundColor: `hsl(${this.colors[i]},100%,50%)` }}>
                    {stamps.map(({ time, key, id }) => <Timestamp
                        handleClick={this.removeStamp}
                        preset={preset}
                        time={time}
                        offset={this.getPercentage(time)}
                        label={key}
                        id={id}
                        key={time + key + id} />)}
                    {preset}
                </div>
            })}
        </div>
    }
}

function Timestamp(props) {
    const removeStamp = () => {
        const { preset, time, id } = props
        props.handleClick({ preset, time, id });
    }

    return <div
        onClick={removeStamp}
        className="timestamp"
        style={{ left: props.offset }}>{props.label}</div>
}


class Controls extends React.Component {
    constructor(props) {
        super(props);
        this.state = { playing: false };
    }
    componentDidMount() {
        document.addEventListener("loopEnd", this.handlePlay);
    }
    componentWillUnmount() {
        document.removeEventListener("loopEnd", this.handlePlay);
    }
    handlePlay = () => {
        const event = new CustomEvent("recorderPlay", { detail: { action: !this.state.playing } });
        document.dispatchEvent(event);
        this.setState((prevState) => ({ playing: !prevState.playing }));
    }
    handleReset = () => {
        const event = new CustomEvent("recorderReset");
        document.dispatchEvent(event);
    }
    handleDownload = () => {
        const event = new CustomEvent("recorderDownload");
        document.dispatchEvent(event);
    }
    render() {
        return <div id="recorderControls">
            <button type="play" onClick={this.handlePlay}>{this.state.playing ? 'PAUSE' : 'PLAY'}</button>
            <button type="loop" onClick={this.props.handleLoop} status={`${this.props.looping}`}>LOOP</button>
            <button type="record" onClick={this.props.handleRecord} status={`${this.props.recording}`}>RECORD</button>
            <button type="reset" onClick={this.handleReset}>RESET</button>
            <button type="download" onClick={this.handleDownload}>DOWNLOAD</button>
        </div>
    }
}