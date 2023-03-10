import audioManifest from './audioManifest.json';
import React from "react";
class SoundPad extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = { playing: false, trackLoaded: false };
    }
    componentDidMount() {
        this.fetchAudioWorker = new SharedWorker(new URL("./fetchAudioWorker.js", import.meta.url));
        this.fetchAudioWorker.port.start();
        this.fetchAudioWorker.port.postMessage(this.props.audioSource);
        this.fetchAudioWorker.port.onmessage = (message) => {
            message.data instanceof ArrayBuffer
                ? this.decodeTrack(message.data)
                : console.error(message.data);
        }
    }
    componentWillUnmount() {
        this.fetchAudioWorker.port.close();
    }
    decodeTrack = (audioData) => {
        this.props.audioContext.decodeAudioData(audioData)
            .then(buffer => {
                this.buffer = buffer;
                this.setState({ trackLoaded: true });
            })
            .catch(e => { console.error(`Error while decoding audio file ${this.props.audioSource}\nError - ${e}`); })
    }
    play = () => {
        if (!this.state.trackLoaded) {
            console.warn(`${this.props.audioSource} hasn't loaded.`);
            return null;
        };
        if (!this.props.power) {
            console.warn(`Power is turned off.`);
            return null;
        }

        this.props.handlePlay(this);

        clearTimeout(this.playingTimeoutID);
        this.setState({ playing: true });
        this.playingTimeoutID = setTimeout(() => { this.setState({ playing: false }) }, 300);

        const audioTrackInstance = this.props.audioContext.createBufferSource();
        audioTrackInstance.buffer = this.buffer;

        audioTrackInstance.connect(this.props.gainNode);
        audioTrackInstance.start();
    }
    render() {
        return <button
            className="soundPad"
            onClick={this.play}
            {...(this.state.playing ? { playing: "true" } : {})}>
            {this.props.label || this.props.audioSource}
        </button>
    }
}

export default class SoundPadGrid extends React.Component {
    constructor(props) {
        super(props);
        this.keyMap = {};
        this.keyList = ["KeyQ", "KeyW", "KeyE", "KeyA", "KeyS", "KeyD", "KeyZ", "KeyX", "KeyC"]
        this.keyList.forEach(e => { this.keyMap[e] = React.createRef() });
    }
    playAudio = ({ code: keyCode }) => {
        this.keyMap[keyCode]?.current.play();
    }
    componentDidMount() {
        window.addEventListener("keydown", this.playAudio);
    }
    componentWillUnmount() {
        window.removeEventListener("keydown", this.playAudio);
    }
    handlePlay = (audioNode) => {
        Object.entries(this.keyMap).some(key => {
            if (key[1].current === audioNode) {
                this.props.handlePlay({
                    filename: audioNode.props.audioSource,
                    buffer: audioNode.buffer,
                    key: key[0].replace(/key/ig, "")
                });
                return true;
            }
            return false;
        })
    }
    fetchAudioFiles = (preset) => audioManifest[preset]?.map(x => `${preset}/${x}`) ??
        audioManifest.default?.map(x => `default/${x}`) ?? [];
    render() {
        return <div id="soundPadGrid">
            {this.fetchAudioFiles(this.props.audio.preset).map((x, i) => {
                const KBkey = this.keyList[i];
                return <SoundPad
                    key={x}
                    ref={this.keyMap[KBkey]}
                    audioSource={x}
                    label={KBkey.replace(/key/ig, "")}
                    power={this.props.audio.power}
                    audioContext={this.props.audio.context}
                    gainNode={this.props.audio.node}
                    handlePlay={this.handlePlay}
                />
            })}
        </div>
    }
}