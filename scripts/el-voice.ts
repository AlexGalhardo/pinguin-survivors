// Hero voices with ElevenLabs (docs/audio.md, skill pinguin-audio-assets).
// 1) Designs one voice per hero (Voice Design → previews in art-src/elevenlabs/voices/<hero>/,
//    the first preview is saved as the hero voice; ids in art-src/elevenlabs/voices.json).
// 2) Speaks every line of src/i18n/voice.*.ts with that same voice in EN and PT-BR →
//    public/assets/audio/vo/vo.<hero>.<event>.<lang>.<n>.mp3 (subtitles match the audio).
// Idempotent: existing voices and files are skipped. Usage: bun --env-file=.env scripts/el-voice.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { HERO_IDS, type HeroId } from '../src/config/constants';
import { VO_EVENTS, VOICE } from '../src/data/voice';
import { voiceEn } from '../src/i18n/voice.en';
import { voicePtBR } from '../src/i18n/voice.pt-BR';
import { logAudio, postAudio, postJson } from './lib/elevenlabs';

const VOICES_FILE = 'art-src/elevenlabs/voices.json';
const OUT_DIR = 'public/assets/audio/vo';
const TTS_MODEL = 'eleven_multilingual_v2';

/** Voice direction per hero (skill rule 5). Penguins, so a slightly gravelly, cartoon-gritty edge. */
const DIRECTION: Record<HeroId, string> = {
	jack: 'Young adult male, cocky and brash action-hero energy, slightly raspy, confident grin in the voice, fast delivery, gritty survivor of a zombie apocalypse',
	bob: 'Middle-aged male war veteran, deep gravelly baritone, dry humor, calm under fire, weathered and tough, speaks with a slow confident cadence',
	lucia: 'Adult female mystic sorceress, calm and low, mysterious and elegant, measured cadence with quiet intensity, slightly ethereal',
};

/** Preview text for the design step (100–1000 chars, per the API). */
function sample(hero: HeroId): string {
	const lines = VO_EVENTS.map((e) => voiceEn[`vo.${hero}.${e}.1` as keyof typeof voiceEn]);
	return lines.join(' ').slice(0, 400);
}

type Voices = Partial<Record<HeroId, string>>;

function loadVoices(): Voices {
	return existsSync(VOICES_FILE)
		? (JSON.parse(readFileSync(VOICES_FILE, 'utf-8')) as Voices)
		: {};
}

async function designVoice(hero: HeroId): Promise<string> {
	const design = (await postJson('/v1/text-to-voice/design?output_format=mp3_44100_128', {
		voice_description: DIRECTION[hero],
		text: sample(hero),
		model_id: 'eleven_multilingual_ttv_v2',
	})) as { previews: { generated_voice_id: string; audio_base_64: string }[] };
	const dir = `art-src/elevenlabs/voices/${hero}`;
	mkdirSync(dir, { recursive: true });
	design.previews.forEach((p, i) => {
		writeFileSync(`${dir}/${i + 1}.mp3`, Buffer.from(p.audio_base_64, 'base64'));
	});
	const chosen = design.previews[0];
	if (!chosen) throw new Error(`no voice preview for ${hero}`);
	const created = (await postJson('/v1/text-to-voice', {
		voice_name: `Pinguin Survivors — ${hero}`,
		voice_description: DIRECTION[hero],
		generated_voice_id: chosen.generated_voice_id,
	})) as { voice_id: string };
	logAudio({
		key: `voice.${hero}`,
		endpoint: '/v1/text-to-voice',
		prompt: DIRECTION[hero],
		params: { previews: design.previews.length, chosen: 1 },
	});
	return created.voice_id;
}

const voices = loadVoices();
for (const hero of HERO_IDS) {
	if (voices[hero]) continue;
	console.log(`designing voice for ${hero}…`);
	voices[hero] = await designVoice(hero);
	mkdirSync('art-src/elevenlabs', { recursive: true });
	writeFileSync(VOICES_FILE, `${JSON.stringify(voices, null, '\t')}\n`);
}

mkdirSync(OUT_DIR, { recursive: true });
const tables = { en: voiceEn, 'pt-BR': voicePtBR } as const;
let made = 0;
for (const hero of HERO_IDS) {
	const voiceId = voices[hero] as string;
	for (const event of VO_EVENTS) {
		for (let n = 1; n <= VOICE.variants; n++) {
			for (const [lang, table] of Object.entries(tables)) {
				const key = `vo.${hero}.${event}.${lang}.${n}`;
				const file = `${OUT_DIR}/${key}.mp3`;
				if (existsSync(file)) continue;
				const text = table[`vo.${hero}.${event}.${n}` as keyof typeof voiceEn];
				const audio = await postAudio(
					`/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
					{
						text,
						model_id: TTS_MODEL,
						voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
					},
				);
				writeFileSync(file, Buffer.from(audio));
				logAudio({
					key,
					endpoint: 'text-to-speech',
					prompt: text,
					params: { voiceId, lang },
				});
				made++;
				console.log(`${key} (${text.length} chars)`);
			}
		}
	}
}
console.log(`done: ${made} new lines`);
