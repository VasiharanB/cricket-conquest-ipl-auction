// ============================================================================
// Cricket Conquest – UI Player Image Resolver
// Resolves authentic cricket photos (match headshots, jersey portraits, playing action).
// Casual event photos, conference photos, or unrelated portraits are strictly excluded.
// If a verified authentic cricket photo is unavailable, returns null to show
// the existing stylish broadcast fallback card.
// ============================================================================

/**
 * Verified Authentic Cricket Match & Jersey Photographs
 * Only includes actual cricket action photos, match jerseys, or official team portraits.
 */
const AUTHENTIC_CRICKET_PHOTOS: Record<string, string> = {
  // Batsmen & All-Rounders
  'david miller': '/players/david-miller.jpg',
  'cameron green': '/players/cameron-green.jpg',
  'virat kohli': '/players/virat-kohli.jpg',
  'rohit sharma': '/players/rohit-sharma.jpg',
  'ms dhoni': '/players/ms-dhoni.jpg',
  'mahendra singh dhoni': '/players/ms-dhoni.jpg',
  'm.s. dhoni': '/players/ms-dhoni.jpg',
  'rishabh pant': '/players/rishabh-pant.jpg',
  'shubman gill': '/players/shubman-gill.jpg',
  'kl rahul': '/players/kl-rahul.jpg',
  'k.l. rahul': '/players/kl-rahul.jpg',
  'david warner': '/players/david-warner.jpg',
  'ben stokes': '/players/ben-stokes.jpg',
  'jos buttler': '/players/jos-buttler.jpg',
  'sanju samson': '/players/sanju-samson.jpg',
  'kane williamson': '/players/kane-williamson.jpg',
  'yashasvi jaiswal': '/players/yashasvi-jaiswal.jpg',
  'suryakumar yadav': '/players/suryakumar-yadav.jpg',
  'ruturaj gaikwad': '/players/ruturaj-gaikwad.jpg',
  'axar patel': '/players/axar-patel.jpg',
  'travis head': '/players/travis-head.jpg',
  'prithvi shaw': '/players/prithvi-shaw.jpg',
  'rachin ravindra': '/players/rachin-ravindra.jpg',
  'jake fraser-mcgurk': '/players/jake-fraser-mcgurk.jpg',
  'jake fraser mcgurk': '/players/jake-fraser-mcgurk.jpg',
  'jason holder': '/players/jason-holder.jpg',
  'shivam dube': '/players/shivam-dube.jpg',
  'krunal pandya': '/players/krunal-pandya.jpg',
  'venkatesh iyer': '/players/venkatesh-iyer.jpg',

  // Bowlers
  'pat cummins': '/players/pat-cummins.jpg',
  'mitchell starc': '/players/mitchell-starc.jpg',
  'rashid khan': '/players/rashid-khan.jpg',
  'trent boult': '/players/trent-boult.jpg',
  'mohammed shami': '/players/mohammed-shami.jpg',
  'mohammed siraj': '/players/mohammed-siraj.jpg',
  'ravichandran ashwin': '/players/ravichandran-ashwin.jpg',
  'sunil narine': '/players/sunil-narine.jpg',
  'wanindu hasaranga': '/players/wanindu-hasaranga.jpg',
  'karn sharma': '/players/karn-sharma.jpg',
  'mujeeb ur rahman': '/players/mujeeb-ur-rahman.jpg',
  'fazalhaq farooqi': '/players/fazalhaq-farooqi.jpg',
};

/**
 * Resolves an authentic presentation image URL for a given player.
 * Checks:
 * 1. Player explicit imageUrl (if provided and valid)
 * 2. Normalized name match against verified authentic cricket photos
 * Returns null if no authentic photo exists, prompting the UI to show the fallback card.
 */
export function resolvePlayerImage(player?: {
  id?: string;
  name?: string;
  imageUrl?: string;
}): string | null {
  if (!player) return null;

  // 1. Explicit imageUrl provided
  if (player.imageUrl && player.imageUrl.trim() !== '') {
    return player.imageUrl.trim();
  }

  // 2. Match by normalized player name
  if (player.name) {
    const cleanName = player.name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (AUTHENTIC_CRICKET_PHOTOS[cleanName]) {
      return AUTHENTIC_CRICKET_PHOTOS[cleanName];
    }

    const slug = cleanName.replace(/[^a-z0-9]+/g, '-');
    if (AUTHENTIC_CRICKET_PHOTOS[slug]) {
      return AUTHENTIC_CRICKET_PHOTOS[slug];
    }
  }

  return null;
}
