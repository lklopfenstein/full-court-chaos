import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const PALETTES = [
  ['#ff2ca8', '#00e5ff', '#ffca3a', '#171a45', '#f3efff'],
  ['#ff6b22', '#8bf000', '#ffe8c2', '#161735', '#7c2cff'],
  ['#00e5ff', '#5b37ff', '#faff00', '#11152f', '#ff4f84'],
  ['#ff3d21', '#ffd644', '#20dbc8', '#130c2c', '#f7f1dc'],
];

const seedPlayers = [
  {
    id: 'nova', realName: 'Maya R.', alias: 'NOVA', number: '08', city: 'Brooklyn, NY', position: 'PG',
    tagline: 'Gravity is optional.', power: 'COSMIC CROSSOVER', palette: 0,
    avatar: '/players/nova.png',
    stats: { pts: 22.4, ast: 8.2, reb: 4.1, stl: 3.4, blk: 0.4 }, wins: 7, heat: 96,
  },
  {
    id: 'glitch', realName: 'Jalen T.', alias: 'GLITCH', number: '404', city: 'Newark, NJ', position: 'SG',
    tagline: 'Now you see me. Now buckets.', power: 'LAG STEP', palette: 1,
    avatar: '/players/glitch.png',
    stats: { pts: 25.8, ast: 4.7, reb: 5.2, stl: 1.8, blk: 0.7 }, wins: 6, heat: 93,
  },
  {
    id: 'bigfoot', realName: 'Cooper B.', alias: 'BIGFOOT', number: '77', city: 'Asheville, NC', position: 'C',
    tagline: 'No rim is safe.', power: 'EARTHQUAKE DUNK', palette: 2,
    avatar: '/players/bigfoot.png',
    stats: { pts: 18.6, ast: 2.1, reb: 13.7, stl: 1.2, blk: 4.8 }, wins: 8, heat: 98,
  },
  {
    id: 'hot-sauce', realName: 'Ari S.', alias: 'HOT SAUCE', number: '99', city: 'Baltimore, MD', position: 'SF',
    tagline: 'Too spicy to guard.', power: 'INFERNO FADE', palette: 3,
    avatar: '/players/hot-sauce.png',
    stats: { pts: 21.2, ast: 5.5, reb: 7.9, stl: 2.6, blk: 1.1 }, wins: 5, heat: 91,
  },
];

const schedule = [
  { date: 'JUL 12', city: 'BALTIMORE, MD', venue: 'THE REC YARD', status: 'TICKETS LIVE', color: 'pink' },
  { date: 'JUL 26', city: 'PHILADELPHIA, PA', venue: 'RIVER RINK', status: 'ALMOST GONE', color: 'cyan' },
  { date: 'AUG 09', city: 'BROOKLYN, NY', venue: 'PIER 2', status: 'COMING SOON', color: 'yellow' },
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function drawGeneratedAvatar(canvas, alias, paletteIndex = 0) {
  const ctx = canvas.getContext('2d');
  const [a, b, c, dark, light] = PALETTES[paletteIndex % PALETTES.length];
  const hash = [...alias].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  canvas.width = 192; canvas.height = 192;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = dark; ctx.fillRect(0, 0, 192, 192);
  for (let y = 0; y < 192; y += 12) {
    for (let x = 0; x < 192; x += 12) {
      if (((x + y + hash) / 12) % 7 === 0) { ctx.fillStyle = `${b}35`; ctx.fillRect(x, y, 12, 12); }
    }
  }
  ctx.fillStyle = a; ctx.fillRect(18, 148, 156, 44);
  ctx.fillStyle = b; ctx.fillRect(30, 136, 132, 16);
  const skin = ['#7f4127', '#a45e38', '#d78b58', '#f3ba7a'][hash % 4];
  const hair = ['#160c18', '#2a1523', '#392117'][hash % 3];
  ctx.fillStyle = skin;
  ctx.fillRect(54, 48, 84, 82); ctx.fillRect(66, 32, 60, 20);
  ctx.fillStyle = hair;
  ctx.fillRect(54, 34, 84, 30);
  if (hash % 2) { ctx.fillRect(42, 45, 18, 44); ctx.fillRect(132, 45, 18, 44); }
  else { for (let x = 54; x < 138; x += 14) ctx.fillRect(x, 22 + ((x / 14) % 2) * 6, 14, 26); }
  ctx.fillStyle = light;
  ctx.fillRect(69, 78, 16, 12); ctx.fillRect(108, 78, 16, 12);
  ctx.fillStyle = dark;
  ctx.fillRect(75, 82, 8, 8); ctx.fillRect(108, 82, 8, 8);
  ctx.fillRect(82, 111, 30, 8);
  ctx.fillStyle = c; ctx.fillRect(88, 136, 16, 56);
  ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.strokeRect(8, 8, 176, 176);
}

function PixelAvatar({ player, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || player.avatar) return;
    drawGeneratedAvatar(ref.current, player.alias, player.palette || 0);
  }, [player]);
  if (player.avatar) return <img className={`pixel-avatar ${className}`} src={player.avatar} alt={`${player.alias} pixel portrait`} />;
  return <canvas className={`pixel-avatar ${className}`} ref={ref} role="img" aria-label={`${player.alias} pixel portrait`} />;
}

function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) { reject(new Error('Please choose a JPG, PNG, or WEBP photo.')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('Please choose a photo smaller than 10 MB.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That photo could not be read.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That photo could not be opened.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSide = 896;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const POSES = [
  { id: 'ready', name: 'READY STANCE', src: [90, 20, 235, 292], head: [90, 5, 47, 59], fit: { scale: 1.1, maxScale: 1.1, y: .08, clearCy: .38, clearRx: .55, clearRy: .46, neckBottom: .98 } },
  { id: 'dribble-left', name: 'LEFT DRIBBLE', src: [455, 35, 260, 280], head: [126, 9, 44, 74], fit: { scale: 1.03, maxScale: 1.05, x: .01, y: .14, clearCy: .33, clearRx: .48, clearRy: .39, neckBottom: .94 } },
  { id: 'dribble-right', name: 'RIGHT DRIBBLE', src: [830, 40, 255, 280], head: [104, 9, 44, 73], fit: { scale: 1.04, maxScale: 1.06, x: -.01, y: .13, clearCy: .33, clearRx: .49, clearRy: .4, neckBottom: .95 } },
  { id: 'crossover', name: 'LOW CROSSOVER', src: [1150, 55, 310, 275], head: [155, 12, 45, 73], fit: { scale: 1.01, maxScale: 1.04, y: .14, clearCy: .33, clearRx: .47, clearRy: .39, neckBottom: .94 } },
  { id: 'jump-shot', name: 'JUMP SHOT', src: [115, 316, 190, 330], head: [70, 52, 55, 70], fit: { scale: .9, maxScale: .94, y: .18, clearX: .08, clearY: .08, clearCy: .43, clearRx: .38, clearRy: .31, neckBottom: .9 } },
  { id: 'one-hand-dunk', name: 'ONE-HAND DUNK', src: [445, 305, 285, 355], head: [93, 59, 54, 70], fit: { scale: .9, maxScale: .94, x: -.01, y: .16, clearX: .08, clearY: .08, clearCy: .42, clearRx: .38, clearRy: .32, neckBottom: .91 } },
  { id: 'two-hand-dunk', name: 'TWO-HAND DUNK', src: [830, 310, 220, 340], head: [72, 69, 52, 71], fit: { scale: .88, maxScale: .93, y: .17, clearX: .08, clearY: .08, clearCy: .42, clearRx: .37, clearRy: .32, neckBottom: .91 } },
  { id: 'layup', name: 'RUNNING LAYUP', src: [1155, 310, 310, 355], head: [105, 58, 56, 69], fit: { scale: .96, maxScale: 1, x: .01, y: .14, clearCy: .38, clearRx: .45, clearRy: .38, neckBottom: .94 } },
  { id: 'defense', name: 'LOCKDOWN D', src: [70, 680, 260, 300], head: [108, 31, 56, 76], fit: { scale: 1, maxScale: 1.03, y: .14, clearCy: .32, clearRx: .47, clearRy: .38, neckBottom: .94 } },
  { id: 'crowd', name: 'CROWD ROAR', src: [440, 635, 255, 350], head: [78, 44, 56, 68], fit: { scale: 1.02, maxScale: 1.05, y: .12, clearCy: .36, clearRx: .48, clearRy: .4, neckBottom: .95 } },
  { id: 'point', name: 'CALL YOUR SHOT', src: [805, 640, 245, 345], head: [64, 31, 57, 67], fit: { scale: 1.02, maxScale: 1.05, x: -.01, y: .12, clearCy: .36, clearRx: .48, clearRy: .4, neckBottom: .95 } },
  { id: 'flex', name: 'FLEX MODE', src: [1175, 640, 225, 345], head: [80, 30, 57, 66], fit: { scale: 1.03, maxScale: 1.06, y: .12, clearCy: .36, clearRx: .48, clearRy: .4, neckBottom: .95 } },
];

let bodyPixModelPromise;
let faceLandmarkModelPromise;
let poseAtlasPromise;

function getBodyPixModel() {
  if (!bodyPixModelPromise) {
    bodyPixModelPromise = Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/body-pix'),
    ]).then(async ([tf, bodyPix]) => {
      await tf.ready();
      return bodyPix.load({
        architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.75, quantBytes: 2,
      });
    });
  }
  return bodyPixModelPromise;
}

function getFaceLandmarkModel() {
  if (!faceLandmarkModelPromise) {
    faceLandmarkModelPromise = Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/face-landmarks-detection'),
    ]).then(async ([tf, landmarks]) => {
      await tf.ready();
      return landmarks.createDetector(landmarks.SupportedModels.MediaPipeFaceMesh, {
        runtime: 'tfjs', refineLandmarks: true, maxFaces: 1,
      });
    });
  }
  return faceLandmarkModelPromise;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That photo could not be opened.'));
    image.src = source;
  });
}

function getPoseAtlas() {
  if (!poseAtlasPromise) poseAtlasPromise = loadImage('/avatar/pose-atlas.png');
  return poseAtlasPromise;
}

function median(values) {
  if (!values.length) return 128;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function detectBounds(labels, width, height, accepts) {
  let minX = width, minY = height, maxX = -1, maxY = -1, pixels = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!accepts(labels[y * width + x])) continue;
    pixels++;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, pixels, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function sampleSkinTone(sourcePixels, labels, width, face) {
  const reds = [], greens = [], blues = [];
  const xInset = face.width * .18, top = face.minY + face.height * .18, bottom = face.minY + face.height * .88;
  for (let y = Math.max(0, Math.floor(top)); y <= Math.min(face.maxY, Math.ceil(bottom)); y += 2) {
    for (let x = Math.max(0, Math.floor(face.minX + xInset)); x <= Math.min(face.maxX, Math.ceil(face.maxX - xInset)); x += 2) {
      const label = labels[y * width + x];
      if (label !== 0 && label !== 1) continue;
      const index = (y * width + x) * 4;
      const r = sourcePixels[index], g = sourcePixels[index + 1], b = sourcePixels[index + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (r < 28 || g < 20 || b < 15 || r > 248 || g > 248 || b > 248) continue;
      if (r < g * .82 || g < b * .72 || (spread < 7 && r < 115)) continue;
      reds.push(r); greens.push(g); blues.push(b);
    }
  }
  if (reds.length < 18) return [174, 112, 77];
  return [median(reds), median(greens), median(blues)];
}

function sampleHairTone(sourcePixels, labels, width, height, face) {
  const samples = [];
  const minX = Math.max(0, Math.floor(face.minX - face.width * .2));
  const maxX = Math.min(width - 1, Math.ceil(face.maxX + face.width * .2));
  const minY = Math.max(0, Math.floor(face.minY - face.height * .48));
  const maxY = Math.min(height - 1, Math.ceil(face.minY + face.height * .28));
  for (let y = minY; y <= maxY; y += 2) for (let x = minX; x <= maxX; x += 2) {
    if (labels[y * width + x] < 0) continue;
    const index = (y * width + x) * 4;
    const color = [sourcePixels[index], sourcePixels[index + 1], sourcePixels[index + 2]];
    samples.push({ color, light: color[0] * .3 + color[1] * .59 + color[2] * .11 });
  }
  if (samples.length < 12) return [42, 28, 24];
  samples.sort((a, b) => a.light - b.light);
  const hair = samples.slice(0, Math.max(8, Math.floor(samples.length * .42)));
  return [median(hair.map(sample => sample.color[0])), median(hair.map(sample => sample.color[1])), median(hair.map(sample => sample.color[2]))];
}

function colorCss(color) {
  return `rgb(${color.map(value => Math.round(clamp(value, 0, 255))).join(',')})`;
}

function shadeColor(color, factor) {
  return color.map(value => value * factor);
}

function mixColor(first, second, amount) {
  return first.map((value, index) => value * (1 - amount) + second[index] * amount);
}

function colorLuma(color) {
  return color[0] * .3 + color[1] * .59 + color[2] * .11;
}

function fillPolygon(context, color, points) {
  context.fillStyle = color;
  context.beginPath();
  points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
  context.closePath(); context.fill();
}

function makePixelFaceSprite(landmarkFace, image, skin, hair, bodyFace) {
  const points = landmarkFace.keypoints;
  const box = landmarkFace.box;
  const safePoint = (index, fallback) => points[index] || fallback;
  const averagePoint = (first, second) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
  const leftEye = averagePoint(
    safePoint(33, { x: box.xMin + box.width * .34, y: box.yMin + box.height * .42 }),
    safePoint(133, { x: box.xMin + box.width * .43, y: box.yMin + box.height * .42 }),
  );
  const rightEye = averagePoint(
    safePoint(362, { x: box.xMin + box.width * .57, y: box.yMin + box.height * .42 }),
    safePoint(263, { x: box.xMin + box.width * .66, y: box.yMin + box.height * .42 }),
  );
  const orderedEyes = [leftEye, rightEye].sort((first, second) => first.x - second.x);
  const nose = safePoint(1, { x: box.xMin + box.width * .5, y: box.yMin + box.height * .62 });
  const mouthLeft = safePoint(61, { x: box.xMin + box.width * .4, y: box.yMin + box.height * .76 });
  const mouthRight = safePoint(291, { x: box.xMin + box.width * .6, y: box.yMin + box.height * .76 });
  const mouthCenter = averagePoint(safePoint(13, mouthLeft), safePoint(14, mouthRight));
  const forehead = safePoint(10, { x: box.xMin + box.width * .5, y: box.yMin + box.height * .14 });
  const mapX = point => clamp(Math.round(7 + ((point.x - box.xMin) / box.width) * 30), 8, 36);
  const mapY = point => clamp(Math.round(9 + ((point.y - box.yMin) / box.height) * 42), 10, 52);
  const eyeY = clamp(Math.round((mapY(orderedEyes[0]) + mapY(orderedEyes[1])) / 2), 23, 29);
  const eyeX = [clamp(mapX(orderedEyes[0]), 14, 19), clamp(mapX(orderedEyes[1]), 25, 30)];
  const noseX = clamp(mapX(nose), 20, 24);
  const noseY = clamp(mapY(nose), eyeY + 5, 38);
  const mouthY = clamp(mapY(mouthCenter), noseY + 5, 47);
  const mouthWidth = clamp(Math.round(Math.abs(mapX(mouthRight) - mapX(mouthLeft)) * .72), 5, 9);
  const hairDepth = clamp(Math.round(10 + ((forehead.y - bodyFace.minY) / Math.max(1, bodyFace.height)) * 7), 10, 15);
  const sprite = document.createElement('canvas');
  sprite.width = 44; sprite.height = 62;
  const context = sprite.getContext('2d');
  const outline = '#07091d';
  const warmedSkin = mixColor(skin, [210, 139, 92], .08);
  const cleanHair = colorLuma(hair) < 32 ? mixColor(hair, [58, 42, 35], .38) : hair;
  const skinDeep = colorCss(shadeColor(warmedSkin, .58));
  const skinShadow = colorCss(shadeColor(warmedSkin, .78));
  const skinBase = colorCss(warmedSkin);
  const skinLight = colorCss(shadeColor(warmedSkin, 1.12));
  const skinBright = colorCss(mixColor(shadeColor(warmedSkin, 1.22), [255, 236, 198], .12));
  const hairShadow = colorCss(shadeColor(cleanHair, .5));
  const hairBase = colorCss(cleanHair);
  const hairLight = colorCss(shadeColor(cleanHair, 1.45));
  const beardTone = colorCss(mixColor(shadeColor(warmedSkin, .72), cleanHair, .28));

  const faceFill = [[13,7],[31,7],[35,11],[38,24],[37,36],[33,47],[27,53],[17,53],[11,47],[7,36],[6,24],[9,11]];

  // One compact, native sprite asset. This is intentionally more like a
  // hand-drawn arcade portrait than a shrunken photo: the uploaded image sets
  // palette and broad feature placement, but the final pixels use the same
  // chunky body-art language as the pose atlas.
  fillPolygon(context, outline, [[14,43],[30,43],[37,62],[7,62]]);
  fillPolygon(context, skinShadow, [[15,43],[30,43],[35,62],[9,62]]);
  fillPolygon(context, skinBase, [[16,43],[28,43],[33,62],[11,62]]);
  context.fillStyle = skinLight; context.fillRect(18, 46, 4, 13);
  context.fillStyle = skinDeep; context.fillRect(29, 48, 2, 12);

  fillPolygon(context, outline, [[13,5],[31,5],[37,10],[40,24],[39,36],[35,49],[28,56],[16,56],[9,49],[5,36],[4,24],[7,10]]);
  context.fillStyle = outline; context.fillRect(3, 24, 5, 11); context.fillRect(36, 24, 5, 11);
  context.fillStyle = skinShadow; context.fillRect(4, 25, 4, 9); context.fillRect(36, 25, 4, 9);
  context.fillStyle = skinBase; context.fillRect(5, 26, 3, 7); context.fillRect(36, 26, 3, 7);
  fillPolygon(context, skinBase, faceFill);

  // Photo light only gets a low-opacity pass, so recognizable shadows survive
  // without turning the head into a pasted miniature photograph.
  const texture = document.createElement('canvas');
  texture.width = 31; texture.height = 42;
  const textureContext = texture.getContext('2d', { willReadFrequently: true });
  textureContext.imageSmoothingEnabled = true;
  const cropX = Math.max(0, box.xMin - box.width * .04);
  const cropY = Math.max(0, box.yMin + box.height * .02);
  textureContext.drawImage(
    image,
    cropX,
    cropY,
    Math.max(1, Math.min(image.width - cropX, box.width * 1.08)),
    Math.max(1, Math.min(image.height - cropY, box.height * .92)),
    0,
    0,
    texture.width,
    texture.height,
  );
  const texturePixels = textureContext.getImageData(0, 0, texture.width, texture.height).data;
  const skinLuma = Math.max(24, colorLuma(skin));
  let lowerDark = 0, lowerSamples = 0;
  for (let y = Math.floor(texture.height * .55); y < texture.height; y++) for (let x = 0; x < texture.width; x++) {
    const index = (y * texture.width + x) * 4;
    const luma = texturePixels[index] * .3 + texturePixels[index + 1] * .59 + texturePixels[index + 2] * .11;
    lowerSamples++;
    if (luma < skinLuma * .66) lowerDark++;
  }
  const hasFacialHair = lowerDark / Math.max(1, lowerSamples) > .18;
  context.save();
  context.globalAlpha = .48;
  context.beginPath();
  faceFill.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
  context.closePath(); context.clip();
  for (let y = 0; y < texture.height; y++) for (let x = 0; x < texture.width; x++) {
    const index = (y * texture.width + x) * 4;
    const luma = texturePixels[index] * .3 + texturePixels[index + 1] * .59 + texturePixels[index + 2] * .11;
    const relativeLight = luma / skinLuma;
    context.fillStyle = relativeLight < .62 ? skinDeep : relativeLight < .84 ? skinShadow : relativeLight < 1.1 ? skinBase : relativeLight < 1.34 ? skinLight : skinBright;
    context.fillRect(x + 7, y + 10, 1, 1);
  }
  context.restore();

  fillPolygon(context, skinShadow, [[9,36],[13,48],[18,54],[14,53],[9,48],[6,37]]);
  fillPolygon(context, skinLight, [[29,13],[35,22],[36,31],[34,29],[31,18]]);
  context.fillStyle = skinDeep; context.fillRect(17, 52, 10, 1);
  context.fillStyle = skinShadow; context.fillRect(13, 45, 4, 2); context.fillRect(27, 45, 4, 2);

  if (hasFacialHair) {
    context.globalAlpha = .52;
    fillPolygon(context, beardTone, [[12,38],[18,41],[26,41],[32,38],[31,48],[27,53],[17,53],[13,48]]);
    context.globalAlpha = 1;
  }

  fillPolygon(context, hairShadow, [[8,12],[10,6],[15,2],[26,1],[34,4],[39,10],[40,17],[36,16],[34,hairDepth],[30,hairDepth + 1],[26,hairDepth],[22,hairDepth + 1],[18,hairDepth],[14,hairDepth + 1],[10,hairDepth],[7,17]]);
  fillPolygon(context, hairBase, [[10,11],[12,7],[16,4],[26,3],[32,5],[36,10],[37,14],[33,13],[30,hairDepth - 1],[26,hairDepth],[22,hairDepth - 1],[18,hairDepth],[14,hairDepth - 1],[10,14]]);
  context.fillStyle = hairLight;
  context.fillRect(16, 5, 5, 1); context.fillRect(25, 5, 4, 1); context.fillRect(12, 10, 2, 1);
  context.fillStyle = hairShadow;
  for (let x = 12; x <= 34; x += 4) context.fillRect(x, hairDepth + ((x / 4) % 2 ? 0 : -1), 3, 1);

  context.fillStyle = hairShadow;
  context.fillRect(eyeX[0] - 3, eyeY - 3, 7, 1); context.fillRect(eyeX[1] - 3, eyeY - 3, 7, 1);
  context.fillStyle = skinBright;
  context.fillRect(eyeX[0] - 2, eyeY, 3, 1); context.fillRect(eyeX[1] - 2, eyeY, 3, 1);
  context.fillStyle = outline;
  context.fillRect(eyeX[0], eyeY, 2, 2); context.fillRect(eyeX[1], eyeY, 2, 2);
  context.fillStyle = skinShadow;
  context.fillRect(eyeX[0] - 3, eyeY + 2, 6, 1); context.fillRect(eyeX[1] - 3, eyeY + 2, 6, 1);

  context.fillStyle = skinShadow;
  context.fillRect(noseX + 1, eyeY + 4, 1, Math.max(2, noseY - eyeY - 3));
  context.fillRect(noseX - 1, noseY, 4, 1);
  context.fillStyle = skinLight;
  context.fillRect(noseX - 1, eyeY + 5, 1, Math.max(2, noseY - eyeY - 5));
  context.fillStyle = skinDeep;
  context.fillRect(Math.round(22 - mouthWidth / 2), mouthY, mouthWidth, 1);
  context.fillStyle = skinLight;
  context.fillRect(Math.round(22 - mouthWidth / 2) + 2, mouthY + 1, Math.max(2, mouthWidth - 4), 1);
  context.fillStyle = skinLight;
  context.fillRect(13, eyeY + 7, 2, 1); context.fillRect(30, eyeY + 7, 2, 1);

  const canvas = document.createElement('canvas');
  canvas.width = 44; canvas.height = 62;
  const output = canvas.getContext('2d');
  output.imageSmoothingEnabled = false;
  output.drawImage(sprite, 0, 0);
  return canvas.toDataURL('image/png');
}

async function extractPlayerIdentity(photo, onStage = () => {}) {
  onStage('LOADING THE FREE FACE ENGINES…');
  const [net, landmarkDetector, image] = await Promise.all([getBodyPixModel(), getFaceLandmarkModel(), loadImage(photo)]);
  onStage('MAPPING YOUR ARCADE FACE…');
  const [parts, landmarkFaces] = await Promise.all([
    net.segmentPersonParts(image, {
      flipHorizontal: false, internalResolution: 'high', segmentationThreshold: 0.62,
      maxDetections: 1, scoreThreshold: 0.25, nmsRadius: 20,
    }),
    landmarkDetector.estimateFaces(image, { flipHorizontal: false, staticImageMode: true }),
  ]);
  const { width, height, data: labels } = parts;
  const source = document.createElement('canvas');
  source.width = width; source.height = height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, width, height);
  const face = detectBounds(labels, width, height, label => label === 0 || label === 1);
  const person = detectBounds(labels, width, height, label => label >= 0);
  if (person.pixels < width * height * .018) throw new Error('We could not find one clear face. Try a brighter, front-facing photo.');
  if (face.pixels < Math.max(24, width * height * .00012)) throw new Error('Move closer and use a clear photo where the player’s face is visible.');
  if (!landmarkFaces.length) throw new Error('We could not map the player’s facial features. Try a straight-on photo with both eyes visible.');
  const sourcePixels = sourceContext.getImageData(0, 0, width, height).data;
  const skin = sampleSkinTone(sourcePixels, labels, width, face);
  const hair = sampleHairTone(sourcePixels, labels, width, height, face);
  return {
    face: makePixelFaceSprite(landmarkFaces[0], image, skin, hair, face),
    skin,
    hair,
  };
}

function recolorPose(canvas, skin) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    if (pixels.data[index + 3] < 20) continue;
    const r = pixels.data[index], g = pixels.data[index + 1], b = pixels.data[index + 2];
    if (b < 90 || g < 70 || b < r * 1.18 || g < r * 1.16) continue;
    const light = clamp((g + b) / 440, .28, 1.08);
    const factor = .48 + light * .62;
    pixels.data[index] = clamp(Math.round(skin[0] * factor), 0, 255);
    pixels.data[index + 1] = clamp(Math.round(skin[1] * factor), 0, 255);
    pixels.data[index + 2] = clamp(Math.round(skin[2] * factor), 0, 255);
  }
  context.putImageData(pixels, 0, 0);
}

function removeSmallAlphaIslands(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const visited = new Uint8Array(canvas.width * canvas.height);
  const components = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || pixels.data[start * 4 + 3] < 24) continue;
    const points = [start];
    visited[start] = 1;
    for (let cursor = 0; cursor < points.length; cursor++) {
      const point = points[cursor], x = point % canvas.width, y = Math.floor(point / canvas.width);
      const neighbors = [];
      if (x) neighbors.push(point - 1);
      if (x < canvas.width - 1) neighbors.push(point + 1);
      if (y) neighbors.push(point - canvas.width);
      if (y < canvas.height - 1) neighbors.push(point + canvas.width);
      for (const next of neighbors) {
        if (visited[next] || pixels.data[next * 4 + 3] < 24) continue;
        visited[next] = 1; points.push(next);
      }
    }
    components.push(points);
  }
  const largest = Math.max(0, ...components.map(component => component.length));
  for (const component of components) {
    if (component.length >= largest * .045) continue;
    for (const point of component) pixels.data[point * 4 + 3] = 0;
  }
  context.putImageData(pixels, 0, 0);
}

function alphaBounds(canvas) {
  const { data } = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (data[(y * canvas.width + x) * 4 + 3] < 20) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { x: Math.max(0, minX - 7), y: Math.max(0, minY - 7), width: Math.min(canvas.width - minX + 7, maxX - minX + 15), height: Math.min(canvas.height - minY + 7, maxY - minY + 15) };
}

async function renderPoseAvatar(identity, poseIndex, onStage = () => {}) {
  const pose = POSES[poseIndex % POSES.length];
  onStage(`BUILDING ${pose.name}…`);
  const [atlas, face] = await Promise.all([getPoseAtlas(), loadImage(identity.face)]);
  const cell = document.createElement('canvas');
  cell.width = pose.src[2]; cell.height = pose.src[3];
  const context = cell.getContext('2d', { willReadFrequently: true });
  context.drawImage(atlas, ...pose.src, 0, 0, cell.width, cell.height);
  removeSmallAlphaIslands(cell);
  recolorPose(cell, identity.skin);
  context.imageSmoothingEnabled = false;
  const [slotX, slotY, slotWidth, slotHeight] = pose.head;
  const fit = { scale: 1.18, maxScale: 1.18, x: 0, y: .055, clearX: .18, clearY: .14, clearCy: .43, clearRx: .68, clearRy: .57, neckTop: .68, neckBottom: 1.03, ...pose.fit };
  const faceAspect = 44 / 62;
  let headWidth = slotWidth * fit.scale;
  let headHeight = headWidth / faceAspect;
  if (headHeight > slotHeight * fit.maxScale) {
    headHeight = slotHeight * fit.maxScale;
    headWidth = headHeight * faceAspect;
  }
  const headX = slotX + (slotWidth - headWidth) / 2 + slotWidth * fit.x;
  const headY = slotY + slotHeight - headHeight + slotHeight * fit.y;
  const clearPadX = Math.max(5, slotWidth * fit.clearX);
  const clearPadY = Math.max(6, slotHeight * fit.clearY);
  const clearCenterY = slotY + slotHeight * fit.clearCy;
  context.save();
  context.beginPath();
  context.ellipse(slotX + slotWidth / 2, clearCenterY, slotWidth * fit.clearRx, slotHeight * fit.clearRy, 0, 0, Math.PI * 2);
  context.clip();
  context.clearRect(slotX - clearPadX, slotY - clearPadY, slotWidth + clearPadX * 2, slotHeight + clearPadY * 2);
  context.restore();
  context.drawImage(face, headX, headY, headWidth, headHeight);
  context.save();
  context.globalCompositeOperation = 'destination-over';
  const neckSkin = mixColor(identity.skin, [210, 139, 92], .08);
  fillPolygon(context, colorCss(neckSkin), [
    [headX + headWidth * .34, headY + headHeight * fit.neckTop],
    [headX + headWidth * .66, headY + headHeight * fit.neckTop],
    [headX + headWidth * .82, headY + headHeight * fit.neckBottom],
    [headX + headWidth * .18, headY + headHeight * fit.neckBottom],
  ]);
  fillPolygon(context, colorCss(shadeColor(neckSkin, .76)), [
    [headX + headWidth * .62, headY + headHeight * (fit.neckTop + .02)],
    [headX + headWidth * .73, headY + headHeight * (fit.neckBottom - .02)],
    [headX + headWidth * .82, headY + headHeight * fit.neckBottom],
    [headX + headWidth * .66, headY + headHeight * fit.neckTop],
  ]);
  context.restore();
  const bounds = alphaBounds(cell);
  const output = document.createElement('canvas');
  output.width = 576; output.height = 720;
  const outputContext = output.getContext('2d');
  outputContext.imageSmoothingEnabled = false;
  const scale = Math.min(540 / bounds.width, 680 / bounds.height);
  const drawW = Math.round(bounds.width * scale), drawH = Math.round(bounds.height * scale);
  outputContext.drawImage(cell, bounds.x, bounds.y, bounds.width, bounds.height, Math.round((output.width - drawW) / 2), output.height - drawH - 18, drawW, drawH);
  return output.toDataURL('image/png');
}

async function forgeArcadeAvatar(photo, player, poseIndex, onStage = () => {}) {
  const identity = await extractPlayerIdentity(photo, onStage);
  const avatar = await renderPoseAvatar(identity, poseIndex, onStage);
  return { avatar, identity, photo, player };
}

function Logo({ small = false }) {
  return <div className={`logo ${small ? 'small' : ''}`}><span>FULL COURT</span><strong>CHAOS</strong><i>★ YOUTH HOOPS ★</i></div>;
}

function Marquee() {
  const words = 'NO BORING BUCKETS • ALTER EGO ACTIVATED • SHOWTIME IS GAME TIME • CROWD GOES WILD • ';
  return <div className="marquee" aria-hidden="true"><div>{words.repeat(5)}</div></div>;
}

function PlayerCard({ player, onClick, rank }) {
  return (
    <button className="player-card" onClick={() => onClick(player)} aria-label={`Open ${player.alias} profile`}>
      <div className="card-top"><span>PLAYER {String(rank).padStart(2, '0')}</span><b>{player.position}</b></div>
      <div className="portrait-wrap"><PixelAvatar player={player} /><span className="number">#{player.number}</span><span className="heat">{player.heat} HEAT</span></div>
      <div className="card-copy"><h3>{player.alias}</h3><p>{player.tagline}</p></div>
      <div className="quick-stats"><span><b>{player.stats.pts}</b> PPG</span><span><b>{player.stats.ast}</b> APG</span><span><b>{player.stats.reb}</b> RPG</span></div>
      <div className="select-link">VIEW PLAYER <span>›</span></div>
    </button>
  );
}

function PlayerModal({ player, onClose, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  useEffect(() => setConfirmingDelete(false), [player?.id]);
  if (!player) return null;
  const stats = [
    ['SCORING', Math.min(100, player.stats.pts * 3.7)], ['PLAYMAKING', Math.min(100, player.stats.ast * 10)],
    ['BOARDS', Math.min(100, player.stats.reb * 7)], ['CHAOS', player.heat],
  ];
  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label={`${player.alias} profile`}>
      <div className="profile-modal">
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="profile-kicker">PLAYER SELECT / {player.position}</div>
        <div className="profile-grid">
          <div className="profile-portrait"><div className="sunburst" /><PixelAvatar player={player} /><span className="huge-number">{player.number}</span></div>
          <div className="profile-info">
            <div className="real-name">ALTER EGO OF {player.realName.toUpperCase()}</div>
            <h2>{player.alias}</h2>
            <p className="quote">“{player.tagline}”</p>
            <div className="bio-line"><span>HOMETOWN</span><b>{player.city}</b><span>RECORD</span><b>{player.wins}-1</b></div>
            <div className="power-up"><span>SIGNATURE POWER</span><strong>{player.power}</strong></div>
            <div className="meters">{stats.map(([label, value]) => <div className="meter" key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><em>{Math.round(value)}</em></div>)}</div>
            <div className="profile-stats">{Object.entries(player.stats).map(([key, value]) => <div key={key}><b>{value}</b><span>{key.toUpperCase()}</span></div>)}</div>
            <div className="profile-actions">
              {!confirmingDelete ? <button className="delete-profile" type="button" onClick={() => setConfirmingDelete(true)}>DELETE PLAYER PROFILE</button> :
                <div className="delete-confirm" role="alert"><span>DELETE {player.alias}? This removes the player and stats from this browser.</span><div><button type="button" onClick={() => setConfirmingDelete(false)}>KEEP PLAYER</button><button className="confirm-delete" type="button" onClick={() => onDelete(player.id)}>YES, DELETE</button></div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Registration({ onClose, onCreate }) {
  const [form, setForm] = useState({ realName: '', alias: '', number: '', city: '', position: 'PG', guardian: '' });
  const [avatar, setAvatar] = useState('');
  const [identity, setIdentity] = useState(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [sourcePhoto, setSourcePhoto] = useState('');
  const [forgeStatus, setForgeStatus] = useState('');
  const [forgeError, setForgeError] = useState('');
  const [step, setStep] = useState(1);
  const generated = { ...form, alias: form.alias || 'PLAYER 1', number: form.number || '00', palette: 0, avatar };
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhoto = async (file) => {
    setAvatar('');
    setIdentity(null);
    setForgeError('');
    setForgeStatus('SCOUTING YOUR LOOK…');
    try {
      const prepared = await preparePhoto(file);
      setSourcePhoto(prepared);
      const result = await forgeArcadeAvatar(prepared, form, poseIndex, setForgeStatus);
      setIdentity(result.identity);
      setAvatar(result.avatar);
      setForgeStatus('');
    } catch (error) {
      setForgeStatus('');
      setForgeError(error.message);
    }
  };
  const choosePose = async (nextPose) => {
    setPoseIndex(nextPose);
    if (!identity) return;
    setForgeError('');
    setForgeStatus(`LOADING POSE ${String(nextPose + 1).padStart(2, '0')}…`);
    try {
      setAvatar(await renderPoseAvatar(identity, nextPose, setForgeStatus));
      setForgeStatus('');
    } catch (error) {
      setForgeStatus('');
      setForgeError(error.message);
    }
  };
  const submit = (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (!avatar) return;
    onCreate({
      id: `local-${Date.now()}`, ...form, alias: form.alias.toUpperCase(),
      stats: { pts: 0, ast: 0, reb: 0, stl: 0, blk: 0 }, wins: 0, heat: 70,
      tagline: 'Rookie mode: OFF.', power: 'TO BE UNLOCKED', avatar, pose: POSES[poseIndex].id,
    });
  };
  return (
    <div className="modal-shell registration-shell" role="dialog" aria-modal="true" aria-label="Create a player">
      <form className="registration" onSubmit={submit}>
        <button type="button" className="close" onClick={onClose}>×</button>
        <div className="form-head"><span>CREATE-A-PLAYER</span><b>STEP {step} / 2</b></div>
        <div className="form-progress"><i className={step >= 1 ? 'on' : ''} /><i className={step >= 2 ? 'on' : ''} /></div>
        {step === 1 ? <>
          <h2>WHO ARE YOU<br/><em>ON THE COURT?</em></h2>
          <p className="form-intro">Players become characters. Pick a name loud enough for an announcer to yell.</p>
          <div className="input-grid">
            <label>REAL FIRST NAME<input required name="realName" value={form.realName ?? ''} onChange={update} placeholder="Maya" /></label>
            <label>ALTER-EGO NAME<input required name="alias" value={form.alias ?? ''} onChange={update} placeholder="NOVA" maxLength="14" /></label>
            <label>JERSEY NUMBER<input required name="number" value={form.number ?? ''} onChange={update} placeholder="08" maxLength="3" /></label>
            <label>POSITION<select name="position" value={form.position ?? 'PG'} onChange={update}><option>PG</option><option>SG</option><option>SF</option><option>PF</option><option>C</option></select></label>
            <label className="wide">HOMETOWN<input required name="city" value={form.city ?? ''} onChange={update} placeholder="Brooklyn, NY" /></label>
            <label className="wide">GUARDIAN EMAIL<input required type="email" name="guardian" value={form.guardian ?? ''} onChange={update} placeholder="grownup@example.com" /></label>
            <label className="wide consent"><input required type="checkbox" /> <span>I am the player’s parent or guardian and approve creation of this profile.</span></label>
          </div>
        </> : <>
          <h2>PIXEL MODE:<br/><em>ACTIVATED</em></h2>
          <p className="form-intro">A clear headshot is enough. The free on-device forge maps the player’s face shape, skin tone, hair, and expression onto the same native pixel grid as the body, then builds a complete arcade player from 12 full-body poses.</p>
          <div className="photo-step">
            <label className={`upload-zone ${forgeStatus && !avatar ? 'forging' : ''}`}>
              {avatar ? <PixelAvatar player={generated} /> : sourcePhoto ? <img className="source-photo" src={sourcePhoto} alt="Uploaded player awaiting arcade conversion" /> : <><span className="upload-icon">＋</span><b>DROP YOUR PLAYER PHOTO</b><small>JPG, PNG, or WEBP · 10 MB max</small></>}
              {forgeStatus && <span className="forge-status"><i />{forgeStatus}</span>}
              <input disabled={Boolean(forgeStatus && !avatar)} required={!avatar} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            </label>
            <div className="mini-card"><span>PLAYER PREVIEW</span><h3>{generated.alias.toUpperCase()}</h3><b>#{generated.number}</b><p>{generated.position} · {generated.city || 'HOMETOWN'}</p></div>
          </div>
          <div className="pose-picker">
            <div><span>CHOOSE A FULL-BODY POSE</span><b>{String(poseIndex + 1).padStart(2, '0')} / {POSES.length} · {POSES[poseIndex].name}</b></div>
            <div className="pose-options">{POSES.map((pose, index) => <button aria-label={`Choose ${pose.name} pose`} title={pose.name} className={poseIndex === index ? 'active' : ''} type="button" key={pose.id} onClick={() => choosePose(index)}>{String(index + 1).padStart(2, '0')}</button>)}</div>
          </div>
          {forgeError && <div className="forge-error">⚠ {forgeError}</div>}
          <p className="privacy-note">100% FREE + PRIVATE: The conversion runs on this device. The original photo never leaves the browser and there are no API or generation fees.</p>
        </>}
        <div className="form-actions">{step === 2 && <button type="button" className="back-btn" onClick={() => setStep(1)}>‹ BACK</button>}<button className="primary-btn" disabled={step === 2 && (!avatar || Boolean(forgeStatus && !avatar))} type="submit">{step === 1 ? 'NEXT: PIXELIZE ME' : 'LOCK IN PLAYER'} <span>››</span></button></div>
      </form>
    </div>
  );
}

function Scorekeeper({ players, setPlayers }) {
  const [selected, setSelected] = useState(players[0]?.id || '');
  useEffect(() => {
    if (!players.some(player => player.id === selected)) setSelected(players[0]?.id || '');
  }, [players, selected]);
  const player = players.find(p => p.id === selected) || players[0];
  if (!player) return null;
  const add = (stat, amount) => setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, stats: { ...p.stats, [stat]: Math.max(0, +(p.stats[stat] + amount).toFixed(1)) } } : p));
  return (
    <section id="scorekeeper" className="scorekeeper section-pad">
      <div className="section-heading light"><div><span>THE CONTROL ROOM</span><h2>LIVE STAT LAB</h2></div><p>A prototype scorekeeper console. Every tap updates the selected player card and saves to this device.</p></div>
      <div className="console">
        <div className="console-player"><PixelAvatar player={player} /><div><small>NOW TRACKING</small><select value={selected ?? ''} onChange={e => setSelected(e.target.value)}>{players.map(p => <option value={p.id} key={p.id}>{p.alias}</option>)}</select><strong>#{player.number} · {player.position}</strong></div></div>
        <div className="stat-controls">{Object.entries(player.stats).map(([stat, value]) => <div className="stat-control" key={stat}><span>{stat}</span><b>{value}</b><div><button onClick={() => add(stat, -1)}>−</button><button onClick={() => add(stat, 1)}>＋</button></div></div>)}</div>
        <div className="save-light"><i /> SAVES AUTOMATICALLY</div>
      </div>
    </section>
  );
}

function App() {
  const [players, setPlayersState] = useState(() => {
    try {
      const saved = localStorage.getItem('fcc-players');
      const deleted = JSON.parse(localStorage.getItem('fcc-deleted-player-ids') || '[]');
      if (!saved) return seedPlayers.filter(player => !deleted.includes(player.id));
      const stored = JSON.parse(saved);
      const custom = stored.filter(player => !seedPlayers.some(seed => seed.id === player.id));
      const demos = seedPlayers.filter(seed => !deleted.includes(seed.id)).map(seed => ({ ...stored.find(player => player.id === seed.id), ...seed }));
      return [...demos, ...custom.filter(player => !deleted.includes(player.id))];
    } catch { return seedPlayers; }
  });
  const [profile, setProfile] = useState(null);
  const [register, setRegister] = useState(false);
  const [menu, setMenu] = useState(false);
  const setPlayers = (next) => setPlayersState(prev => typeof next === 'function' ? next(prev) : next);
  useEffect(() => {
    try { localStorage.setItem('fcc-players', JSON.stringify(players)); }
    catch { console.warn('Player data could not be saved in this browser.'); }
  }, [players]);
  const leaders = useMemo(() => [...players].sort((a, b) => b.stats.pts - a.stats.pts), [players]);
  const created = (player) => { setPlayersState(prev => [...prev, player]); setRegister(false); setProfile(player); };
  const deletePlayer = (id) => {
    setPlayersState(prev => prev.filter(player => player.id !== id));
    try {
      const deleted = JSON.parse(localStorage.getItem('fcc-deleted-player-ids') || '[]');
      if (!deleted.includes(id)) localStorage.setItem('fcc-deleted-player-ids', JSON.stringify([...deleted, id]));
    } catch { console.warn('Deleted player state could not be saved in this browser.'); }
    setProfile(null);
  };
  const scrollTo = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return <>
    <header>
      <button className="brand-button" onClick={() => scrollTo('top')}><Logo small /></button>
      <nav className={menu ? 'open' : ''}>
        <button onClick={() => scrollTo('players')}>PLAYERS</button><button onClick={() => scrollTo('tour')}>THE TOUR</button><button onClick={() => scrollTo('rules')}>HOW IT WORKS</button><button onClick={() => scrollTo('scorekeeper')}>STAT LAB</button>
      </nav>
      <button className="join-top" onClick={() => setRegister(true)}>CREATE A PLAYER <span>↗</span></button>
      <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? '×' : '☰'}</button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-copy">
          <div className="eyebrow"><i /> BASKETBALL, BUT UNHINGED</div>
          <h1>YOUR GAME.<br/><span>YOUR ALTER EGO.</span><br/>YOUR SHOW.</h1>
          <p>A youth basketball league where players become characters, every bucket tells a story, and the crowd is part of the game.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={() => setRegister(true)}>ENTER THE CHAOS <span>››</span></button><button className="ghost-btn" onClick={() => scrollTo('players')}><i>▶</i> MEET THE PLAYERS</button></div>
        </div>
        <div className="hero-stamp"><span>EST.</span><strong>20<br/>26</strong><em>PLAY LOUD</em></div>
        <div className="scroll-note">SCROLL TO START <i>↓</i></div>
      </section>
      <Marquee />

      <section id="players" className="players-section section-pad">
        <div className="section-heading"><div><span>CHOOSE YOUR CHAOS</span><h2>MEET THE ROSTER</h2></div><p>Real kids. Larger-than-life alter egos. Real stats tracked every time they step on the floor.</p></div>
        <div className="player-grid">{players.map((p, i) => <PlayerCard key={p.id} player={p} rank={i + 1} onClick={setProfile} />)}</div>
        <button className="text-button" onClick={() => setRegister(true)}>THINK YOU BELONG HERE? <b>CREATE YOUR PLAYER →</b></button>
      </section>

      <section className="manifesto">
        <div className="manifesto-noise" />
        <div className="manifesto-copy"><span>THIS AIN'T YOUR NORMAL LEAGUE</span><h2>WE KEEP SCORE.<br/><em>WE ALSO KEEP IT WEIRD.</em></h2><p>Full Court Chaos combines real competition with entrances, nicknames, power plays, fan challenges, trick-shot timeouts, and maximum personality.</p></div>
        <div className="manifesto-cards"><article><b>01</b><h3>REAL HOOPS</h3><p>Official refs, tracked stats, competitive games.</p></article><article><b>02</b><h3>BIG CHARACTERS</h3><p>Every player creates an unforgettable alter ego.</p></article><article><b>03</b><h3>FULL SHOW</h3><p>Music, intros, wild rules, and crowd-powered moments.</p></article></div>
      </section>

      <section id="rules" className="rules section-pad">
        <div className="section-heading"><div><span>HOW THE MADNESS WORKS</span><h2>THREE STEPS TO LEGEND</h2></div></div>
        <div className="steps">
          <article><span className="step-no">01</span><div className="step-icon">♟</div><h3>BUILD YOUR ALTER EGO</h3><p>Choose a name, number, look, signature move, and upload a photo.</p><i>CREATE-A-PLAYER</i></article>
          <article><span className="step-no">02</span><div className="step-icon">▦</div><h3>GET PIXELIZED</h3><p>Your real photo becomes a custom arcade-style player portrait.</p><i>PIXEL MODE</i></article>
          <article><span className="step-no">03</span><div className="step-icon">ϟ</div><h3>MAKE THE CROWD ROAR</h3><p>Play real games, earn real stats, climb the Chaos leaderboard.</p><i>SHOWTIME</i></article>
        </div>
      </section>

      <section id="tour" className="tour section-pad">
        <div className="section-heading light"><div><span>CHAOS IS COMING</span><h2>THE 2026 TOUR</h2></div><p>Three cities. One traveling spectacle. Zero quiet gyms.</p></div>
        <div className="tour-list">{schedule.map((s, i) => <article key={s.city}><span className={`city-index ${s.color}`}>0{i + 1}</span><time>{s.date}</time><div><h3>{s.city}</h3><p>{s.venue} · DOORS 5:30 PM</p></div><button onClick={() => alert(`${s.city} ticket notifications are coming soon.`)}>{s.status} <b>↗</b></button></article>)}</div>
      </section>

      <section className="leaderboard section-pad">
        <div className="section-heading"><div><span>ARCADE LEADERBOARD</span><h2>WHO'S ON FIRE?</h2></div><p>Season leaders update as scorekeepers log each game.</p></div>
        <div className="leader-table"><div className="leader-row header-row"><span>RK</span><span>PLAYER</span><span>PTS</span><span>AST</span><span>REB</span><span>HEAT</span></div>{leaders.slice(0, 5).map((p, i) => <button className="leader-row" key={p.id} onClick={() => setProfile(p)}><b>0{i + 1}</b><span className="leader-name"><PixelAvatar player={p} /><strong>{p.alias}<small>{p.position} · #{p.number}</small></strong></span><span>{p.stats.pts}</span><span>{p.stats.ast}</span><span>{p.stats.reb}</span><em>{p.heat}</em></button>)}</div>
      </section>

      <Scorekeeper players={players} setPlayers={setPlayers} />

      <section className="final-cta">
        <div><span>PLAYER ONE, ARE YOU READY?</span><h2>CREATE THE VERSION OF YOU<br/>THE CROWD <em>CAN'T FORGET.</em></h2><button className="primary-btn" onClick={() => setRegister(true)}>BUILD MY PLAYER <span>››</span></button></div>
      </section>
    </main>
    <footer><Logo small /><p>REAL HOOPS. UNREAL PERSONALITY.</p><div><button onClick={() => scrollTo('players')}>PLAYERS</button><button onClick={() => scrollTo('tour')}>TOUR</button><button onClick={() => scrollTo('rules')}>THE RULES</button></div><small>© 2026 FULL COURT CHAOS · ALL KIDS DESERVE A SPOTLIGHT</small></footer>
    <PlayerModal player={profile} onClose={() => setProfile(null)} onDelete={deletePlayer} />
    {register && <Registration onClose={() => setRegister(false)} onCreate={created} />}
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
