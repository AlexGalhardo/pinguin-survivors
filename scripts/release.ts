// Release in the vukem scheme (ADR-015, SDD-011 RF-05): gates → bump → CHANGELOG → commit → tag →
// push → GitHub release. Usage: bun scripts/release.ts 0.0.12 [--dry-run] [--stable]
import { $ } from 'bun';
import { REPO_URL, releaseNotes } from './lib/release-notes';

const version = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
	console.error('usage: bun scripts/release.ts X.Y.Z [--dry-run]');
	process.exit(1);
}
const tag = `v${version}`;
// 0.x releases are pre-releases unless --stable marks one as the repository's Latest (from 0.2.0 on).
const prerelease = version.startsWith('0.') && !process.argv.includes('--stable');
const today = new Date().toISOString().slice(0, 10);

if ((await $`git status --porcelain`.text()).trim() !== '') {
	console.error('working tree is not clean');
	process.exit(1);
}
const previousTag =
	(await $`git describe --tags --abbrev=0 --match ${'v*'}`.nothrow().text()).trim() || null;
const notes = await releaseNotes(previousTag, 'HEAD', version);

if (dryRun) {
	console.log(
		`${tag} (prerelease: ${prerelease}) since ${previousTag ?? 'the beginning'}\n\n${notes}`,
	);
	process.exit(0);
}

for (const gate of ['lint', 'typecheck', 'test', 'build']) {
	console.log(`gate: bun run ${gate}`);
	await $`bun run ${gate}`.quiet();
}

const pkgPath = 'package.json';
const pkg = JSON.parse(await Bun.file(pkgPath).text()) as { version: string } & Record<
	string,
	unknown
>;
pkg.version = version;
await Bun.write(pkgPath, `${JSON.stringify(pkg, null, '\t')}\n`);

const changelogPath = 'CHANGELOG.md';
let changelog = await Bun.file(changelogPath).text();
const compare = previousTag
	? `${REPO_URL}/compare/${previousTag}...${tag}`
	: `${REPO_URL}/releases/tag/${tag}`;
changelog = changelog.replace(
	'## [Unreleased]\n',
	`## [Unreleased]\n\n## [${version}] - ${today}\n`,
);
changelog = changelog.replace(
	/^\[Unreleased\]: .*$/m,
	`[Unreleased]: ${REPO_URL}/compare/${tag}...HEAD\n[${version}]: ${compare}`,
);
await Bun.write(changelogPath, changelog);

await $`git add package.json CHANGELOG.md`;
await $`git commit -q -m ${`chore(release): ${version}`}`;
await $`git tag -a ${tag} -m ${version}`;
await $`git push origin main --follow-tags`.quiet();
const file = `${process.env.TEMP ?? '/tmp'}/notes-${version}.md`;
await Bun.write(file, notes);
const flags = prerelease ? ['--prerelease'] : ['--latest'];
await $`gh release create ${tag} --title ${tag} --notes-file ${file} ${flags}`;
console.log(`released ${tag}`);
