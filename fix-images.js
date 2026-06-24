const fs = require('fs');
const files = [
  'app/sections/NewArrivals.tsx',
  'app/sections/MatiMarine.tsx',
  'app/sections/LovedByIcons.tsx',
  'app/sections/ArtTriptych.tsx',
  'app/sections/Hero.tsx'
];
const targetImage = '/images/product_master_1_1782290164345.png';
const regex = /https:\/\/images\.unsplash\.com\/[^']*/g;
const regexDouble = /https:\/\/images\.unsplash\.com\/[^"]*/g;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(regex, targetImage);
    content = content.replace(regexDouble, targetImage);
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
