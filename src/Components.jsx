import audioManifest from './audioManifest.json';
import React from "react";

class AudioComponent extends React.PureComponent {
    constructor(props) {
        super(props)
        this.state = { playing: false, trackLoaded: false };
        this.fetchTrack(this.props.audioSource)
            .then(response => response.arrayBuffer())
            .then(audioBuffer => { this.decodeTrack(audioBuffer, 0.05) })
            .catch(error => { console.error(error) });
    }

    fetchTrack = (audioSource) => (new Promise((resolve, reject) => {
        fetch(`./audio/${audioSource}`)
            .then(response => {
                response.ok
                    ? resolve(response)
                    : reject(`Couldn't load track ${audioSource}\nStatus code - ${response.status}, Error - ${response.statusText}`)
            })
            .catch(error => { reject(`Error while fetching ${audioSource}\nError -${error}`) })
    }))
    decodeTrack = (audioData, volume) => {
        this.audioContext = new window.AudioContext();
        this.audioTrack = this.audioContext.createBufferSource();
        this.audioContext.decodeAudioData(audioData)
            .then(buffer => {
                this.audioTrack.buffer = buffer;
                this.gainNode = this.audioContext.createGain();
                this.gainNode.gain.value = volume;
                this.gainNode.connect(this.audioContext.destination);
                this.audioTrack.connect(this.gainNode);
                this.setState({ trackLoaded: true });
            })
            .catch(e => { console.error(`Error while decoding audio file ${this.props.audioSource}\nError - ${e}`); })
    }
    play = () => {
        if (!this.state.trackLoaded) {
            console.warn(`${this.props.audioSource} hasn't loaded.`);
            return null;
        };

        clearTimeout(this.playingTimeoutID);
        this.setState({ playing: true });
        this.playingTimeoutID = setTimeout(() => { this.setState({ playing: false }) }, 300);

        const audioTrackInstance = this.audioContext.createBufferSource();
        audioTrackInstance.buffer = this.audioTrack.buffer;
        audioTrackInstance.connect(this.gainNode);
        audioTrackInstance.start();
    }

    render() {
        return <button
            className="audioComponent square"
            onClick={this.play}
            {...(this.state.playing ? { playing: "true" } : {})}>
            {this.props.label || this.props.audioSource.replace("./source/audio/", "")}
        </button>
    }
}

class AudioGrid extends React.Component {
    constructor(props) {
        super(props);
        this.audioGridRef = React.createRef();
        this.state = { mode: "default" };
        this.keyMap = {};
        this.audioModes = {};
        audioManifest.modes.forEach(mode => { this.audioModes[mode] = audioManifest[mode] })
        this.keyList = ["KeyQ", "KeyW", "KeyE", "KeyA", "KeyS", "KeyD", "KeyZ", "KeyX", "KeyC"]
        this.keyList.forEach(e => { this.keyMap[e] = React.createRef() });
    }
    componentDidMount() {
        window.addEventListener("keydown", (e) => {
            this.keyMap[e.code]?.current.play();
        });
    }
    fetchAudioFiles = (mode) => this.audioModes[mode] ?? this.audioModes.default
    render() {
        return <div id="audioGrid" ref={this.audioGridRef}>
            {this.fetchAudioFiles(this.state.mode).map((x, i) => {
                const KBkey = this.keyList[i];
                return <AudioComponent
                    key={x}
                    ref={this.keyMap[KBkey]}
                    audioSource={`/${this.state.mode}/${x}`}
                    label={KBkey}
                />
            })}
        </div>
    }
}

class SettingsPanel extends React.Component {
    render() { return <i style={{ fontWeight: 500 }} className="fa fa-github"></i> }
}

export class DrumMachine extends React.Component {
    render() {
        return <div id="drumMachine"><AudioGrid /><SettingsPanel /></div>
    }
}

export class Background extends React.Component {
    render() {
        return <div id="background"></div>
    }
}