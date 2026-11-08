import bobArt from './assets/keyart.bob.png';
import jackArt from './assets/keyart.jack.png';

/** Key art used by every page of this build: picked once at build time (docs/site.md §3). */
export const KEY_ART = Math.random() < 0.5 ? jackArt : bobArt;
