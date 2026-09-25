const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'public', 'players');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const list = [
  // Rohit Sharma batting in cricket match
  ['rohit-sharma.jpg', 'https://upload.wikimedia.org/wikipedia/commons/9/98/Rohit_Sharma_Batting.jpg'],
  // Rishabh Pant in match action
  ['rishabh-pant.jpg', 'https://upload.wikimedia.org/wikipedia/commons/0/02/Rishabh_Pant_%2829693622367%29_%28cropped%29.jpg'],
  // MS Dhoni official Indian cricket kit
  ['ms-dhoni.jpg', 'https://upload.wikimedia.org/wikipedia/commons/7/70/Mahendra_Singh_Dhoni_January_2016_%28cropped%29.jpg'],
  // Jasprit Bumrah in Indian ODI jersey
  ['jasprit-bumrah.jpg', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Jasprit_Bumrah_in_2023.jpg'],
  // Hardik Pandya in India jersey match
  ['hardik-pandya.jpg', 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Hardik_Pandya_2023.jpg'],
  // Ravindra Jadeja in India match jersey
  ['ravindra-jadeja.jpg', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Ravindra_Jadeja_2023.jpg'],
  // Shreyas Iyer in India jersey
  ['shreyas-iyer.jpg', 'https://upload.wikimedia.org/wikipedia/commons/2/23/Shreyas_Iyer_2023.jpg']
];

for (const [file, url] of list) {
  const dest = path.join(targetDir, file).replace(/\\/g, '/');
  try {
    execSync(`curl.exe -s -L -H "User-Agent: ${UA}" "${url}" -o "${dest}"`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Updated ${file}: ${fs.statSync(dest).size} bytes`);
    } else {
      console.log(`Failed for ${file}`);
    }
  } catch (e) {
    console.log(`Error ${file}:`, e.message);
  }
}
