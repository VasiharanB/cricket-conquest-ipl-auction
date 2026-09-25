const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'public', 'players');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchPlayerPhoto(name, slug) {
  const dest = path.join(targetDir, `${slug}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
    console.log(`[EXISTS] ${slug}`);
    return true;
  }

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(name + ' cricketer')}&gsrlimit=1&prop=pageimages&pithumbsize=600&format=json`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'CricketConquestBot/1.0 (info@cricketconquest.org)' }
    });
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) {
      console.log(`[NO_PAGE] ${name}`);
      return false;
    }
    const firstPage = Object.values(pages)[0];
    const thumbUrl = firstPage?.thumbnail?.source;
    if (!thumbUrl) {
      console.log(`[NO_THUMB] ${name}`);
      return false;
    }

    // Download file
    const imgRes = await fetch(thumbUrl, {
      headers: { 'User-Agent': 'CricketConquestBot/1.0 (info@cricketconquest.org)' }
    });
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(arrayBuffer));
      console.log(`[SAVED via Fetch] ${slug} (${arrayBuffer.byteLength} bytes)`);
      return true;
    }

    // Fallback to curl
    try {
      execSync(`curl.exe -s -L -H "User-Agent: CricketConquestBot/1.0" "${thumbUrl}" -o "${dest.replace(/\\/g, '/')}"`);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`[SAVED via Curl] ${slug} (${fs.statSync(dest).size} bytes)`);
        return true;
      }
    } catch (curlErr) {
      console.log(`[CURL_ERR] ${name}:`, curlErr.message);
    }
  } catch (err) {
    console.log(`[ERR] ${name}:`, err.message);
  }
  return false;
}

async function main() {
  const players = [
    ['David Miller', 'david-miller'],
    ['Cameron Green', 'cameron-green'],
    ['Pathum Nissanka', 'pathum-nissanka'],
    ['Rahul Tripathi', 'rahul-tripathi'],
    ['Sarfaraz Khan', 'sarfaraz-khan'],
    ['Prithvi Shaw', 'prithvi-shaw'],
    ['Matheesha Pathirana', 'matheesha-pathirana'],
    ['Anrich Nortje', 'anrich-nortje'],
    ['Ravi Bishnoi', 'ravi-bishnoi'],
    ['Akeal Hosein', 'akeal-hosein'],
    ['Jasprit Bumrah', 'jasprit-bumrah'],
    ['Virat Kohli', 'virat-kohli'],
    ['Rohit Sharma', 'rohit-sharma'],
    ['MS Dhoni', 'ms-dhoni'],
    ['Pat Cummins', 'pat-cummins'],
    ['Mitchell Starc', 'mitchell-starck'],
    ['Mitchell Starc', 'mitchell-starc'],
    ['Hardik Pandya', 'hardik-pandya'],
    ['Rashid Khan', 'rashid-khan'],
    ['Ravindra Jadeja', 'ravindra-jadeja'],
    ['Rishabh Pant', 'rishabh-pant'],
    ['Shubman Gill', 'shubman-gill'],
    ['KL Rahul', 'kl-rahul'],
    ['David Warner', 'david-warner'],
    ['Ben Stokes', 'ben-stokes'],
    ['Jos Buttler', 'jos-buttler'],
    ['Trent Boult', 'trent-boult'],
    ['Mohammed Shami', 'mohammed-shami'],
    ['Mohammed Siraj', 'mohammed-siraj'],
    ['Ravichandran Ashwin', 'ravichandran-ashwin'],
    ['Shreyas Iyer', 'shreyas-iyer'],
    ['Sanju Samson', 'sanju-samson'],
    ['Yashasvi Jaiswal', 'yashasvi-jaiswal'],
    ['Suryakumar Yadav', 'suryakumar-yadav'],
    ['Ruturaj Gaikwad', 'ruturaj-gaikwad'],
    ['Axar Patel', 'axar-patel'],
    ['Travis Head', 'travis-head'],
    ['Heinrich Klaasen', 'heinrich-klaasen'],
    ['Kagiso Rabada', 'kagiso-rabada'],
    ['Sunil Narine', 'sunil-narine'],
    ['Wanindu Hasaranga', 'wanindu-hasaranga'],
    ['Venkatesh Iyer', 'venkatesh-iyer'],
    ['Liam Livingstone', 'liam-livingstone'],
    ['Rachin Ravindra', 'rachin-ravindra'],
    ['Gerald Coetzee', 'gerald-coetzee'],
    ['Jake Fraser-McGurk', 'jake-fraser-mcgurk'],
    ['Deepak Hooda', 'deepak-hooda'],
    ['Daryl Mitchell', 'daryl-mitchell'],
    ['Shivam Dube', 'shivam-dube'],
    ['Arshdeep Singh', 'arshdeep-singh'],
    ['Rinku Singh', 'rinku-singh'],
    ['Yuzvendra Chahal', 'yuzvendra-chahal'],
    ['Bhuvneshwar Kumar', 'bhuvneshwar-kumar'],
    ['Jofra Archer', 'jofra-archer'],
    ['Marcus Stoinis', 'marcus-stoinis'],
    ['Faf du Plessis', 'faf-du-plessis'],
    ['Kane Williamson', 'kane-williamson'],
    ['Quinton de Kock', 'quinton-de-kock'],
    ['Glenn Maxwell', 'glenn-maxwell'],
    ['Nicholas Pooran', 'nicholas-pooran'],
    ['Mustafizur Rahman', 'mustafizur-rahman'],
    ['Matt Henry', 'matt-henry'],
    ['Shivam Mavi', 'shivam-mavi'],
    ['Rahul Chahar', 'rahul-chahar'],
    ['Lungi Ngidi', 'lungi-ngidi'],
    ['Adam Milne', 'adam-milne'],
    ['Kuldeep Sen', 'kuldeep-sen'],
    ['Kyle Jamieson', 'kyle-jamieson'],
    ['Jason Holder', 'jason-holder'],
    ['Matthew Short', 'matthew-short'],
    ['Ben Duckett', 'ben-duckett'],
    ['Fazalhaq Farooqi', 'fazalhaq-farooqi'],
    ['Maheesh Theekshana', 'maheesh-theekshana'],
    ['Mujeeb Ur Rahman', 'mujeeb-ur-rahman'],
    ['Karn Sharma', 'karn-sharma'],
    ['Chetan Sakariya', 'chetan-sakariya'],
    ['Taskin Ahmed', 'taskin-ahmed'],
    ['Alzarri Joseph', 'alzarri-joseph'],
    ['Riley Meredith', 'riley-meredith'],
    ['Jhye Richardson', 'jhye-richardson'],
    ['Gus Atkinson', 'gus-atkinson'],
    ['Wiaan Mulder', 'wiaan-mulder'],
    ['Vijay Shankar', 'vijay-shankar'],
    ['Mahipal Lomror', 'mahipal-lomror'],
    ['Sean Abbott', 'sean-abbott'],
    ['Michael Bracewell', 'michael-bracewell'],
    ['Dan Lawrence', 'dan-lawrence'],
    ['Rajat Patidar', 'rajat-patidar'],
    ['Krunal Pandya', 'krunal-pandya'],
    ['Abhishek Sharma', 'abhishek-sharma'],
    ['Harshal Patel', 'harshal-patel'],
    ['Nitish Kumar Reddy', 'nitish-kumar-reddy'],
    ['Harshit Rana', 'harshit-rana'],
    ['Varun Chakravarthy', 'varun-chakravarthy'],
    ['Ajinkya Rahane', 'ajinkya-rahane'],
    ['Mayank Yadav', 'mayank-yadav'],
    ['Josh Hazlewood', 'josh-hazlewood'],
    ['Tim David', 'tim-david'],
    ['Mitchell Marsh', 'mitchell-marsh'],
    ['Tristan Stubbs', 'tristan-stubbs'],
    ['Marco Jansen', 'marco-jansen'],
    ['Aiden Markram', 'aiden-markram'],
    ['Glenn Phillips', 'glenn-phillips'],
    ['Rovman Powell', 'rovman-powell'],
    ['Shimron Hetmyer', 'shimron-hetmyer'],
    ['Kamindu Mendis', 'kamindu-mendis']
  ];

  console.log(`Starting to fetch ${players.length} players...`);
  let success = 0;
  for (const [name, slug] of players) {
    const ok = await fetchPlayerPhoto(name, slug);
    if (ok) success++;
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`Finished: ${success} photos available in public/players/`);
}

main();
