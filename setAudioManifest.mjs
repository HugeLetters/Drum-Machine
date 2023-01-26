import { readdir, writeFile } from 'fs/promises'
const publicDir = "./public";
const srcDir = "./src"
const audioDir = `${publicDir}/audio`;

readdir(audioDir).then(modes => {
    const manifest = { modes };
    Promise.all(modes.map(mode => readdir(`${audioDir}/${mode}`).then(audioList => { manifest[mode] = audioList })))
        .then(_ => writeFile(`${srcDir}/audioManifest.json`, JSON.stringify(manifest)));
})