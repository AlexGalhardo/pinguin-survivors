import { STEAM_URL } from '../../src/data/demo';

/** Build flag `SITE_RELEASED=true` swaps the landing CTA from Wishlist to Buy (off until the launch). */
export const SITE_RELEASED = process.env.SITE_RELEASED === 'true';

/** Wishlist target with the UTM the Steam stats look for (docs/site.md §1). */
export const WISHLIST_URL = `${STEAM_URL}?utm_source=site`;
/** Store page with the UTM the Steam stats look for; same page as the wishlist (Steam TBD until the App ID). */
export const BUY_URL = `${STEAM_URL}?utm_source=site&utm_medium=buy`;
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=TBD';
export const GITHUB_URL = 'https://github.com/AlexGalhardo/pinguin-survivors';
