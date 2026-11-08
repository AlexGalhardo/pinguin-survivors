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
