export function setColorPalette(list) {
    return list.map((_, i) =>( i * 360 / list.length).toFixed())
}