const fs = require('fs');
const path = require('path');
const https = require('https');

const targetDir = path.join(__dirname, '..', 'public', 'players');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return resolve(false);
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(true)));
      file.on('error', err => {
        fs.unlink(dest, () => {});
        resolve(false);
      });
    }).on('error', () => resolve(false));
  });
}

const list = [
  ['Shreyas_Iyer', 'shreyas-iyer'],
  ['Sanju_Samson', 'sanju-samson'],
  ['Kagiso_Rabada', 'kagiso-rabada'],
  ['Heinrich_Klaasen', 'heinrich-klaasen'],
  ['Quinton_de_Kock', 'quinton-de-kock'],
  ['Kane_Williamson', 'kane-williamson'],
  ['Faf_du_Plessis', 'faf-du-plessis'],
  ['Glenn_Maxwell', 'glenn-maxwell'],
  ['Nicholas_Pooran', 'nicholas-pooran'],
  ['Rinku_Singh', 'rinku-singh'],
  ['Arshdeep_Singh', 'arshdeep-singh'],
  ['Yuzvendra_Chahal', 'yuzvendra-chahal'],
  ['Bhuvneshwar_Kumar', 'bhuvneshwar-kumar'],
  ['Jofra_Archer', 'jofra-archer'],
  ['Marcus_Stoinis', 'marcus-stoinis'],
  ['Matheesha_Pathirana', 'matheesha-pathirana'],
  ['Anrich_Nortje', 'anrich-nortje'],
  ['Ravi_Bishnoi', 'ravi-bishnoi'],
  ['Daryl_Mitchell_(cricketer)', 'daryl-mitchell'],
  ['Shivam_Dube', 'shivam-dube'],
  ['Jason_Holder', 'jason-holder'],
  ['Matthew_Short', 'matthew-short'],
  ['Ben_Duckett', 'ben-duckett'],
  ['Fazalhaq_Farooqi', 'fazalhaq-farooqi'],
  ['Maheesh_Theekshana', 'maheesh-theekshana'],
  ['Mujeeb_Ur_Rahman', 'mujeeb-ur-rahman'],
  ['Karn_Sharma', 'karn-sharma'],
  ['Alzarri_Joseph', 'alzarri-joseph'],
  ['Rajat_Patidar', 'rajat-patidar'],
  ['Krunal_Pandya', 'krunal-pandya'],
  ['Abhishek_Sharma_(cricketer)', 'abhishek-sharma'],
  ['Harshal_Patel', 'harshal-patel'],
  ['Ajinkya_Rahane', 'ajinkya-rahane'],
  ['Josh_Hazlewood', 'josh-hazlewood'],
  ['Tim_David', 'tim-david'],
  ['Mitchell_Marsh', 'mitchell-marsh'],
  ['Aiden_Markram', 'aiden-markram'],
  ['Glenn_Phillips_(cricketer)', 'glenn-phillips'],
  ['Shimron_Hetmyer', 'shimron-hetmyer'],
  ['Mustafizur_Rahman', 'mustafizur-rahman'],
  ['Matt_Henry_(cricketer)', 'matt-henry'],
  ['Shivam_Mavi', 'shivam-mavi'],
  ['Rahul_Chahar', 'rahul-chahar'],
  ['Lungi_Ngidi', 'lungi-ngidi']
];

async function main() {
  for (const [title, slug] of list) {
    const dest = path.join(targetDir, `${slug}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log(`[EXISTS] ${slug}`);
      continue;
    }
    const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const thumb = data?.thumbnail?.source;
    if (thumb) {
      const ok = await downloadFile(thumb, dest);
      if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`[SAVED] ${slug} (${fs.statSync(dest).size} bytes)`);
      } else {
        console.log(`[FAILED_DL] ${slug}`);
      }
    } else {
      console.log(`[NO_THUMB] ${slug}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }
}

main();
