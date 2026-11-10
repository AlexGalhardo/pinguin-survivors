// Music tracks with the ElevenLabs Music API (docs/audio.md). One take per key, skipped when the
// file exists. Never name games, bands or artists in prompts (the API rejects them).
// Usage: bun --env-file=.env scripts/el-music.ts [key ...]   (~560 credits per 45 s)

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { logAudio, postAudio } from './lib/elevenlabs';

interface Track {
	key: string;
	prompt: string;
	lengthMs: number;
}

/** [boss id, musical theme, bpm] — the boss's own battle music (src/data/enemies.ts BOSS_ROUNDS). */
const BOSS_THEMES: readonly (readonly [string, string, number])[] = [
	[
		'leopardSeal',
		'icy antarctic coast, howling polar wind, cold tremolo picking, deep sub drops like cracking ice',
		158,
	],
	[
		'polarBear',
		'frozen tundra, massive slow stomping riffs, roaring low brass stabs, blizzard noise',
		140,
	],
	[
		'rotTreant',
		'cursed rotting forest, creaking wood percussion, tribal war drums, eerie low flute over doom riffs',
		128,
	],
	['mooseKing', 'ancient forest king, regal horn calls, galloping riffs, thunderous toms', 150],
	[
		'hiveQueen',
		'alien insect hive, buzzing distorted synths, skittering hi-hats, acidic dissonant leads',
		168,
	],
	[
		'biomechColossus',
		'giant war machine, mechanical industrial hammering, servo whines, heavy syncopated djent riffs',
		145,
	],
	[
		'drownedDiver',
		'sunken harbor, deep underwater rumble, sonar pings, slow crushing sludge riffs, chains dragging',
		120,
	],
	[
		'kraken',
		'stormy sea monster, crashing waves, tentacle-like swirling guitar leads, relentless blast beats',
		175,
	],
	[
		'plagueHierophant',
		'plague cathedral, dark choir-like synth pads, church bell tolls, ritual drums, blackened tremolo riffs',
		162,
	],
	[
		'abomination',
		'final nightmare, chaotic dissonant chords, screaming feedback, the heaviest breakdown, apocalyptic and huge',
		180,
	],
];

/** Round themes: different styles so random rounds do not repeat the same mood. */
const ROUND_THEMES: readonly string[] = [
	'groovy thrash riffs, palm-muted chugs, punchy snare, 165 bpm',
	'industrial metal with pulsing synth bass and mechanical percussion, 145 bpm',
	'melodic death metal with harmonized twin guitar leads, 160 bpm',
	'stomping groove metal with bouncy syncopated riffs, 125 bpm',
	'fast hardcore punk metal with gang-shout energy but no voices, 180 bpm',
	'dark synthwave meets metal, retro arpeggios over distorted guitars, 140 bpm',
	'nu metal style bouncy riffs with scratchy turntable-like noises, 110 bpm',
	'blackened speed metal with icy tremolo picking, 190 bpm',
	'heavy sludge groove with fuzzed bass and slow massive drums turning into a fast section, 100 bpm',
];

const TRACKS: Track[] = [
	{
		key: 'music.late',
		prompt: 'Relentless instrumental industrial death metal track for the late, desperate rounds of a brutal zombie horde survival video game set in a ruined burning city: crushing low-tuned guitar chugs, frantic double kick drums, sirens-like dissonant synth leads, dark pounding industrial percussion, urgent and apocalyptic, 155 bpm, loopable, no vocals',
		lengthMs: 45000,
	},
	{
		key: 'music.shop',
		prompt: 'Instrumental ambient track for a shop screen in a brutal zombie horde game: low wind over arctic silence, soft distant metal clank, slow minor drone, melancholic and calm, 70 bpm, loopable, no vocals',
		lengthMs: 30000,
	},
	{
		key: 'music.forest',
		prompt: 'Instrumental heavy metal track for a dark pine forest stage in a brutal zombie horde survival video game: low-tuned chugging guitars, tribal toms, eerie wooden flute and wind through the trees, brooding and relentless, 135 bpm, loopable, no vocals',
		lengthMs: 36000,
	},
	{
		key: 'music.city',
		prompt: 'Instrumental industrial metal track for a destroyed city overrun by alien creatures in a brutal horde survival video game: cold mechanical synth pulses, distorted guitars, metallic percussion, acidic dissonant lead, tense and relentless, 150 bpm, loopable, no vocals',
		lengthMs: 36000,
	},
	// Boss battle themes, one per campaign boss (2026-11-10, developer request; ~50 s each).
	...BOSS_THEMES.map(([id, theme, bpm]) => ({
		key: `music.boss.${id}`,
		prompt: `Instrumental heavy metal boss battle track for a brutal zombie horde survival video game, ${theme}, crushing low-tuned guitars, pounding double kick drums, epic and menacing, ${bpm} bpm, loopable, no long intro, no vocals`,
		lengthMs: 50000,
	})),
	// Round themes picked at random during normal rounds (2026-11-10; ~45 s each).
	...ROUND_THEMES.map((theme, i) => ({
		key: `music.round.${i + 1}`,
		prompt: `Instrumental metal track for a fast arena round of a brutal zombie horde survival video game, ${theme}, loopable, no long intro, no vocals`,
		lengthMs: 45000,
	})),
	{
		key: 'music.shop.theme',
		prompt: 'Instrumental theme for a merchant shop screen between rounds of a brutal zombie horde game: a lone wandering penguin merchant, warm low acoustic guitar with a slow metal riff underneath, soft music-box melody, crackling campfire ambience, calm but with a hint of danger, 85 bpm, loopable, no vocals',
		lengthMs: 40000,
	},
];

const wanted = process.argv.slice(2);
mkdirSync('public/assets/audio/music', { recursive: true });
for (const t of TRACKS) {
	if (wanted.length > 0 && !wanted.includes(t.key)) continue;
	const file = `public/assets/audio/music/${t.key}.mp3`;
	if (existsSync(file)) continue;
	console.log(`composing ${t.key}…`);
	const audio = await postAudio('/v1/music?output_format=mp3_44100_128', {
		prompt: t.prompt,
		music_length_ms: t.lengthMs,
		force_instrumental: true,
	});
	writeFileSync(file, Buffer.from(audio));
	logAudio({
		kind: 'music',
		key: t.key,
		endpoint: '/v1/music',
		lengthMs: t.lengthMs,
		prompt: t.prompt,
	});
	console.log(`${t.key} saved (${Math.round(audio.byteLength / 1024)} KB)`);
}
