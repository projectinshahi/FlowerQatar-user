const fs = require('fs');
const path = require('path');

const directories = ['app', 'components'];
const fileExtensions = ['.tsx', '.ts'];

const replacements = {
  '\\btext-dark\\b': 'text-primary',
  '\\bbg-dark\\b': 'bg-primary',
  '\\bborder-dark\\b': 'border-primary',
  '\\btext-gold\\b': 'text-secondary',
  '\\bbg-gold\\b': 'bg-secondary',
  '\\bborder-gold\\b': 'border-secondary',
  '\\bring-gold\\b': 'ring-secondary',
  '\\btext-charcoal\\b': 'text-secondary',
  '\\bbg-charcoal\\b': 'bg-secondary',
  '\\btext-gray\\b': 'text-muted',
  // Keep border-divider but it will use the new divider color
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else {
      if (fileExtensions.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

function processFiles() {
  let changedFiles = 0;
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return;
    
    const files = walkDir(fullPath);
    files.forEach(file => {
      let content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      
      for (const [pattern, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(pattern, 'g');
        newContent = newContent.replace(regex, replacement);
      }
      
      // Also update layout.tsx metadata from Venus et Fleur to Lebami
      if (file.endsWith('layout.tsx')) {
        newContent = newContent.replace(/Venus et Fleur/g, 'Lebami');
      }

      if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
      }
    });
  });
  console.log(`Successfully updated ${changedFiles} files.`);
}

processFiles();
