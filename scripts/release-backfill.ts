// One-off retag of the Pinguin history to the vukem scheme (ADR-015, SDD-011 RF-04/RF-06):
// v0.1.0-alpha.N / v0.1.0-beta.N → v0.0.N, then GitHub pre-releases for each new tag.
// Idempotent: skips tags and releases that already exist. `--dry-run` prints the plan only.
import { $ } from 'bun';
import { releaseNotes } from './lib/release-notes';

const MAP: ReadonlyArray<readonly [oldTag: string, newVersion: string]> = [
	['v0.1.0-alpha.1', '0.0.1'],
	['v0.1.0-alpha.2', '0.0.2'],
	['v0.1.0-beta.1', '0.0.3'],
	['v0.1.0-beta.2', '0.0.4'],
	['v0.1.0-beta.3', '0.0.5'],
	['v0.1.0-beta.4', '0.0.6'],
	['v0.1.0-beta.5', '0.0.7'],
	['v0.1.0-beta.6', '0.0.8'],
	['v0.1.0-beta.7', '0.0.9'],
	['v0.1.0-beta.8', '0.0.10'],
];

const dryRun = process.argv.includes('--dry-run');

async function tagExists(tag: string): Promise<boolean> {
	return (await $`git tag -l ${tag}`.text()).trim() === tag;
}

async function releaseExists(tag: string): Promise<boolean> {
	return (await $`gh release view ${tag}`.nothrow().quiet()).exitCode === 0;
}

let previous: string | null = null;
for (const [oldTag, version] of MAP) {
	const newTag = `v${version}`;
	const sha = (
		await $`git rev-list -n1 ${(await tagExists(oldTag)) ? oldTag : newTag}`.text()
	).trim();
	const date = (await $`git log -1 --format=%cs ${sha}`.text()).trim();
	const notes = await releaseNotes(previous, sha, version);
	console.log(`\n${oldTag} → ${newTag} @ ${sha.slice(0, 7)} (${date})`);
	if (dryRun) {
		console.log(notes.split('\n').slice(0, 6).join('\n'));
	} else {
		if (!(await tagExists(newTag))) await $`git tag -a ${newTag} ${sha} -m ${version}`;
		if (await tagExists(oldTag)) await $`git tag -d ${oldTag}`;
		await $`git push origin ${newTag}`.quiet();
		await $`git push origin --delete ${oldTag}`.nothrow().quiet();
		if (!(await releaseExists(newTag))) {
			const file = `${process.env.TEMP ?? '/tmp'}/notes-${version}.md`;
			await Bun.write(file, notes);
			await $`gh release create ${newTag} --title ${newTag} --notes-file ${file} --prerelease`;
			console.log(`release ${newTag} created`);
		} else {
			console.log(`release ${newTag} already exists`);
		}
	}
	previous = sha;
}
