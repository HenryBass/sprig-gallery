import * as gridEngine from "./engine.js";

async function drawGames(games) {
  const imgs = [];

  for (const game of games) {
    if (game.name.split('.').pop() != 'js') continue;
    const src = await fetch(game.download_url).then(x => x.text());

    let screen, bitmaps;
    const setScreenSize = (w, h) => screen = new ImageData(w, h);
    const { api, state } = gridEngine.init({
      palette,
      setBitmaps: bm => bitmaps = bm,
      setScreenSize,
    });
    api.setScreenSize = setScreenSize;
    api.afterInput = () => {};
    api.onInput = () => {};

    try {
      new Function(...Object.keys(api), src)(...Object.values(api));

      if (!screen) throw new Error("never set screen size");
      if (!bitmaps) throw new Error("never set legend");
    } catch(e) {
      console.error(`couldn't run ${game.name}: ${e}`);
      continue;
    }

    screen.data.fill(255);
    drawTiles(state, api, screen, bitmaps);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.max(screen.width, screen.height);
    canvas.imageSmoothingEnabled = false;
    canvas.getContext("2d").putImageData(screen, 0, 0);
    console.log(canvas);
    imgs.push({ name: game.name, download_url: canvas.toDataURL() });
  }

  return imgs;

  function blitSprite(screen, sprite, tx, ty) {
    const [_, { imageData: { data: bitmap } }] = sprite;
    for (let x = 0; x < 16; x++)
      for (let y = 0; y < 16; y++) {
        const sx = tx*16 + x;
        const sy = ty*16 + y;

        if (bitmap[(y*16 + x)*4 + 3] < 255) continue;

        screen.data[(sy*screen.width + sx)*4 + 0] = bitmap[(y*16 + x)*4 + 0];
        screen.data[(sy*screen.width + sx)*4 + 1] = bitmap[(y*16 + x)*4 + 1];
        screen.data[(sy*screen.width + sx)*4 + 2] = bitmap[(y*16 + x)*4 + 2];
        screen.data[(sy*screen.width + sx)*4 + 3] = bitmap[(y*16 + x)*4 + 3];
      }
  }

  function drawTiles(state, api, screen, bitmaps) {
    const { dimensions, legend } = state;
    const { width, height, maxTileDim } = dimensions;

    const grid = api.getGrid();

    for (const cell of grid) {
      const zOrder = legend.map(x => x[0]);
      cell.sort((a, b) => zOrder.indexOf(a.type) - zOrder.indexOf(b.type));

      for (const { x, y, type } of cell) {
        blitSprite(screen, bitmaps.find(x => x[0] == type), x, y);
      }
    }
  }
}