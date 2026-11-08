// Prints the ElevenLabs credit balance (never the key). Usage: bun --env-file=.env scripts/el-quota.ts
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('ELEVENLABS_API_KEY missing in .env');
const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
	headers: { 'xi-api-key': key },
});
if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
const s = (await res.json()) as {
	tier?: string;
	character_count: number;
	character_limit: number;
	next_character_count_reset_unix?: number;
};
const reset = s.next_character_count_reset_unix
	? new Date(s.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)
	: '?';
console.log(
	`tier ${s.tier ?? '?'}: used ${s.character_count} of ${s.character_limit} · left ${s.character_limit - s.character_count} · resets ${reset}`,
);

export {};
