// Generates sound effects with ElevenLabs. Candidates go to art-src/elevenlabs/sfx/<key>/<n>.mp3;
// the chosen one (default: 1) is copied to public/assets/audio/sfx/<key>.mp3.
// Usage: bun scripts/el-sfx.ts [key ...]      (no args = every key not generated yet)
//        bun scripts/el-sfx.ts --pick <key> <n>
//        bun scripts/el-sfx.ts --variants     (extra takes of SFX_VARIANTS → <key>.<n>.mp3)

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { SFX_VARIANTS } from '../src/data/sfx';
import { logAudio, soundEffect } from './lib/elevenlabs';

interface SfxDef {
	key: string;
	text: string;
	durationSeconds: number;
	variants: number;
}

/** Catalog grows with docs/audio.md; keys match src/art/manifest.ts (sfx.*). */
const SFX: SfxDef[] = [
	{
		key: 'sfx.achievement',
		text: 'Triumphant achievement unlocked sting for a brutal heavy metal video game: a short distorted electric guitar power chord hit with a bright metallic chime and a deep boom, epic and satisfying',
		durationSeconds: 2.5,
		variants: 3,
	},
	{
		key: 'sfx.hit',
		text: 'wet meaty flesh impact of a blade hitting a zombie, short and punchy, video game hit sound',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.swing',
		text: 'fast machete whoosh swing through the air, sharp, video game',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.shotgun',
		text: 'powerful double barrel shotgun blast with punchy low end and short echo, video game',
		durationSeconds: 1,
		variants: 1,
	},
	{
		key: 'sfx.cast',
		text: 'magic staff casting an elemental bolt, crackling energy whoosh, video game spell',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.explosion',
		text: 'brutal explosion with debris and fire, heavy boom, video game',
		durationSeconds: 1.5,
		variants: 1,
	},
	{
		key: 'sfx.splat',
		text: 'gory splatter of blood and guts hitting snow, wet squelch, video game gore',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.zombieDeath',
		text: 'zombie animal dying groan cut short with a gurgle, creepy, short, video game',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.heroHurt',
		text: 'small penguin grunting in pain, cartoonish but gritty, short, video game',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.pickupXp',
		text: 'tiny bright crystal chime pickup, sparkly, very short, video game',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.pickupFish',
		text: 'wet fish slap pickup with a coin clink, short, cartoonish, video game',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.levelUp',
		text: 'epic level up fanfare with distorted guitar riff and choir hit, short, heavy metal video game',
		durationSeconds: 1.8,
		variants: 1,
	},
	{
		key: 'sfx.card',
		text: 'card selection whoosh with a heavy metallic stamp, video game menu',
		durationSeconds: 0.6,
		variants: 1,
	},
	{
		key: 'sfx.potion',
		text: 'drinking a potion gulp followed by a magical healing shimmer, short, video game',
		durationSeconds: 1,
		variants: 1,
	},
	{
		key: 'sfx.bossRoar',
		text: 'huge zombie polar bear roar, monstrous, rotten and terrifying, video game boss',
		durationSeconds: 2.5,
		variants: 1,
	},
	{
		key: 'sfx.super',
		text: 'massive superpower activation: bass drop, distorted guitar chug and a whooshing blast wave, heavy metal video game',
		durationSeconds: 2,
		variants: 1,
	},
	{
		key: 'sfx.uiSelect',
		text: 'short crisp menu select click with a metallic tick, video game ui',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.gameOver',
		text: 'dark game over sting: slow heavy distorted guitar chord fading with a low drone, doom metal, video game',
		durationSeconds: 2.5,
		variants: 1,
	},
	{
		key: 'sfx.shopOpen',
		text: 'old wooden shop door bell chime with a short metallic latch click, arctic merchant stall opening, short and clean, cartoon gritty',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.shopBuy',
		text: 'metal coins dropping into a cash box and a short register bell, ka-ching, short and clean, cartoon gritty',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.shopReroll',
		text: 'cards shuffling fast with a metallic rattle and a short whoosh, dice roll, short, cartoon gritty',
		durationSeconds: 0.8,
		variants: 1,
	},
	{
		key: 'sfx.shopLock',
		text: 'heavy iron padlock clicking shut, short metallic clack, cartoon gritty',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.weaponFuse',
		text: 'two metal weapons forging together: hammer clang on an anvil with a sparks sizzle and a short power-up shimmer, cartoon gritty',
		durationSeconds: 1.2,
		variants: 1,
	},
	{
		key: 'sfx.shopNoFish',
		text: 'empty cash drawer denied buzzer, dull wooden thud with a short negative error tone, cartoon gritty',
		durationSeconds: 0.5,
		variants: 1,
	},
	{
		key: 'sfx.fire',
		text: 'magic staff casting a fire bolt, crackling flame burst with a short roaring whoosh, cartoon gritty',
		durationSeconds: 1.0,
		variants: 1,
	},
	{
		key: 'sfx.ice',
		text: 'magic staff casting an ice bolt, crystalline freezing crack with a short icy whoosh, cartoon gritty',
		durationSeconds: 1.0,
		variants: 1,
	},
	{
		key: 'sfx.earth',
		text: 'magic staff casting an earth spell, heavy rock slam with rumbling stone crack, cartoon gritty',
		durationSeconds: 1.0,
		variants: 1,
	},
	{
		key: 'sfx.lightning',
		text: 'magic staff casting a lightning bolt, sharp electric zap crackle with a thunder snap, cartoon gritty',
		durationSeconds: 1.0,
		variants: 1,
	},
	{
		key: 'sfx.freeze',
		text: 'enemies freezing solid, sudden ice shatter crystallizing burst with a short frosty chime, cartoon gritty',
		durationSeconds: 1.0,
		variants: 1,
	},
];

const OUT = 'public/assets/audio/sfx';
const RAW = 'art-src/elevenlabs/sfx';

const args = process.argv.slice(2);
if (args[0] === '--pick') {
	const [, key, n] = args;
	copyFileSync(`${RAW}/${key}/${n}.mp3`, `${OUT}/${key}.mp3`);
	console.log(`picked ${key} #${n}`);
	process.exit(0);
}

if (args[0] === '--variants') {
	for (const [key, count] of Object.entries(SFX_VARIANTS)) {
		const def = SFX.find((s) => s.key === key);
		if (!def) continue;
		mkdirSync(`${RAW}/${key}`, { recursive: true });
		for (let n = 2; n <= (count ?? 1); n++) {
			const out = `${OUT}/${key}.${n}.mp3`;
			if (existsSync(out)) continue;
			const raw = `${RAW}/${key}/${n}.mp3`;
			if (!existsSync(raw)) {
				const audio = await soundEffect({
					text: def.text,
					durationSeconds: def.durationSeconds,
				});
				await Bun.write(raw, audio);
				logAudio({
					kind: 'sfx',
					key,
					variant: n,
					endpoint: '/v1/sound-generation',
					text: def.text,
					durationSeconds: def.durationSeconds,
				});
			}
			copyFileSync(raw, out);
			console.log(`${key} variant ${n}`);
		}
	}
	process.exit(0);
}

const list = args.length ? SFX.filter((s) => args.includes(s.key)) : SFX;
mkdirSync(OUT, { recursive: true });
for (const sfx of list) {
	if (!args.length && existsSync(`${OUT}/${sfx.key}.mp3`)) {
		console.log(`skip ${sfx.key}`);
		continue;
	}
	mkdirSync(`${RAW}/${sfx.key}`, { recursive: true });
	for (let n = 1; n <= sfx.variants; n++) {
		const audio = await soundEffect({ text: sfx.text, durationSeconds: sfx.durationSeconds });
		await Bun.write(`${RAW}/${sfx.key}/${n}.mp3`, audio);
		logAudio({
			kind: 'sfx',
			key: sfx.key,
			variant: n,
			endpoint: '/v1/sound-generation',
			text: sfx.text,
			durationSeconds: sfx.durationSeconds,
		});
		console.log(`${sfx.key} #${n} (${audio.byteLength} bytes)`);
	}
	copyFileSync(`${RAW}/${sfx.key}/1.mp3`, `${OUT}/${sfx.key}.mp3`);
}
