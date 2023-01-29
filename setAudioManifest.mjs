import { readdir, writeFile } from 'fs/promises'
const publicDir = "./public";
const srcDir = "./src"
const audioDir = `${publicDir}/audio`;

readdir(audioDir).then(presets => {
    const manifest = { presets };
    Promise.all(presets.map(preset => readdir(`${audioDir}/${preset}`).then(audioList => { manifest[preset] = audioList })))
        .then(_ => writeFile(`${srcDir}/audioManifest.json`, JSON.stringify(manifest)));
})