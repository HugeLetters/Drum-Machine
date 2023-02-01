export function randomInt(min = 0, max = 100) {
    return Math.floor((max - min + 1) * Math.random()) + min;
}