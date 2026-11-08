# Security policy

## Supported versions

Only the latest release on [GitHub Releases](https://github.com/AlexGalhardo/pinguin-survivors/releases) and the builds published on Steam, Google Play and the official site receive security fixes. Older releases are not patched.

## Reporting a vulnerability

Please do not open a public issue, discussion or pull request for a security vulnerability.

Report it privately through the GitHub [Report a vulnerability](https://github.com/AlexGalhardo/pinguin-survivors/security/advisories/new) form (private security advisory). If you cannot use GitHub, contact the maintainer through the e-mail listed on the [maintainer's GitHub profile](https://github.com/AlexGalhardo) with "Security" in the subject.

Include what you found, where (file, build, platform or URL), how to reproduce it and the impact you expect. Proofs of concept are welcome; do not include other people's data.

## What to expect

- Acknowledgement within 3 business days.
- An assessment and, when confirmed, a fix plan within 14 days, depending on severity.
- Credit in the release notes once the fix ships, unless you prefer to stay anonymous.

## Scope

In scope: this repository, the desktop (Electron) and Android (Capacitor) builds, the browser demo and the static site.

Out of scope:

- Save-file editing or memory editing on the player's own machine (single-player game; local saves are not a trust boundary).
- Leaderboard score manipulation without a code-level flaw (there is no server-side validation; see ADR-011).
- Denial of service, volumetric testing or automated scanning of the GitHub Pages site.
- Social engineering, phishing and physical attacks.
- Findings in third-party services (Steam, Google Play, GitHub, PixelLab, ElevenLabs) that are not caused by this project's configuration.
- Reports without a demonstrated security impact.

## Safe harbour

Research done in good faith, within this scope, without accessing or modifying other people's data and without degrading the services, will not lead to legal action from the maintainer.
