const fs = require('fs');
const path = require('path');

const srcDir = 'd:/rw/rightway-vanilla/images/New folder';
const coursesDir = 'd:/rw/rightway-vanilla/images/courses';
const cardsDir = 'd:/rw/rightway-vanilla/images/cards';

const mapping = {
  ui_ux_design: 'ui_ux_design.webp',
  ui_ux_architect: 'ui_ux_architect.jpeg',
  graphic_design: 'graphic_design.webp',
  industrial_design: 'industrial_design.png',
  python: 'python_card.jpeg',
  machine_learn: 'machine_learn.jpeg',
  python_ml: 'python_ml.jpeg',
  medical_coding: 'medical_coding.jpg.jpeg',
  office_accounting: 'office_accounting.jpeg',
  tally: 'tally.jpeg',
  excel: 'excel.jpeg',
  adobe_illustrator: 'adobe_illustartor.jpeg',
  adobe_photoshop: 'adobe_Photoshop.png',
  coreldraw: 'coreldraw.jpeg'
};

if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir, { recursive: true });

for (const [id, filename] of Object.entries(mapping)) {
  let sourcePath = path.join(srcDir, filename);
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(coursesDir, filename);
  }
  if (!fs.existsSync(sourcePath)) {
    console.error(`Missing file: ${filename}`);
    continue;
  }
  
  const ext = path.extname(filename).toLowerCase();
  
  // 1. Copy to cards with id + ext and original filename
  fs.copyFileSync(sourcePath, path.join(cardsDir, `${id}${ext}`));
  fs.copyFileSync(sourcePath, path.join(cardsDir, filename));
  
  // 2. Copy to courses with id + ext and original filename
  fs.copyFileSync(sourcePath, path.join(coursesDir, `${id}${ext}`));
  fs.copyFileSync(sourcePath, path.join(coursesDir, filename));
  
  // 3. Normalized extensions
  if (ext === '.jpeg' || ext === '.jpg' || filename.includes('.jpg')) {
    fs.copyFileSync(sourcePath, path.join(cardsDir, `${id}.jpeg`));
    fs.copyFileSync(sourcePath, path.join(cardsDir, `${id}.jpg`));
    fs.copyFileSync(sourcePath, path.join(coursesDir, `${id}.jpeg`));
    fs.copyFileSync(sourcePath, path.join(coursesDir, `${id}.jpg`));
  }
  if (ext === '.webp') {
    fs.copyFileSync(sourcePath, path.join(cardsDir, `${id}.webp`));
    fs.copyFileSync(sourcePath, path.join(coursesDir, `${id}.webp`));
  }
  if (ext === '.png') {
    fs.copyFileSync(sourcePath, path.join(cardsDir, `${id}.png`));
    fs.copyFileSync(sourcePath, path.join(coursesDir, `${id}.png`));
  }
}

console.log("Successfully synchronized all course and card images!");
