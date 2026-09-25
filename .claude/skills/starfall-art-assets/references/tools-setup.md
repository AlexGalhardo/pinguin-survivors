# AI art tools — setup and status

## Retro Diffusion (default)

- **REST API v2** (used by `scripts/rd-generate.ts`): `https://api.retrodiffusion.ai/v2`, header `X-RD-Token: <key>`.
  Key in `.env` as `RETRO_DIFFUSION_API_KEY` (gitignored). Balance: `GET /v2/inferences/credits`. Styles and size limits: `GET /v2/styles/selector`.
  Pay-as-you-go credits at https://retrodiffusion.ai (1 credit = US$0.01).
- **MCP** (optional, same backend): `claude mcp add --transport http retrodiffusion https://mcp.retrodiffusion.ai/mcp --header "Authorization: Bearer <key>"`
  then restart the session. Use it for interactive exploration; keep using the script for anything that must be logged/reproduced.
- Docs: https://retrodiffusion.ai/app/guide/api · examples: https://github.com/Retro-Diffusion/api-examples · MCP repo: https://github.com/Retro-Diffusion/retro-diffusion-mcp

## PixelLab MCP (fallback, already configured at user level)

- Server `pixellab` (`https://api.pixellab.ai/mcp`). Good for 4/8-direction characters (`create_character` + `animate_character`) and map objects.
- Status 2026-09-25: trial exhausted (US$0.00). Check with `get_balance` before planning. Download results and save them under `art-src/rd/<key>/` before slicing.
- `pixelart_workbench` is free (manual pixel edits by the agent) — useful to fix a few pixels after generation.

## Scenario MCP (backgrounds / key art) — not configured

- `claude mcp add --transport http scenario https://mcp.scenario.com/` → `/mcp` → OAuth login (Scenario account with credits).
- Output is high-res "pixel style" art: run it through `bun scripts/pixelize.ts <in> <key> <size>` (block downscale + Endesga quantization), never straight into the atlas.

## pixel-mcp + Aseprite (manual polish, animation, spritesheets) — not configured

- Requires **Aseprite** installed (paid, ~US$20 on Steam/itch, or compiled from source) — not installed on this machine (2026-09-25).
- Repo: https://github.com/willibrandon/pixel-mcp. Build/download the binary, set the Aseprite path in its config, then
  `claude mcp add pixel-mcp -- <path-to-pixel-mcp.exe>` and restart the session.
- Use it for: palette-locked edits with Endesga 32, dithering/shading passes, exporting spritesheets (`<key>.walk` strips).

## Higgsfield — postponed by the user (only for the 1.0 key art if needed)

`claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp` + OAuth. Output goes through `pixelize.ts`.
