# Changelog

## 0.1.3

- Fix composer attachments lost on empty/new sessions or session switches: paperclip and pasted images are queued per session until the attachment slot is ready instead of being dropped.
- Pending file cards are scoped to their session, so unsent files no longer follow you across a session switch.
- Paperclip, paste, and document drop all route through the official `onAddImages` path.

## 0.1.2

- Compatible with DeepSeek Harness `0.1.2-rc.1` (also `0.1.1-rc.2` / `0.1.2-alpha.4`).
- Paperclip button matches native composer icon chrome (28×28, full-round).
- Test gate: ModuleLoader client id and cordis.patch.yml insert.name must equal package.json name.

## 0.1.1

- Compatible with DeepSeek Harness `0.1.2-alpha.4` (also `0.1.1-rc.2`).
- Drop `@deepseek-ai/dsh-client-runtime` from `dsh.client.inject` — that package was removed in DSH 0.1.2-alpha.1. Client still loads after `dsh-client-ui-conversation` so slot names stay valid.

## 0.1.0

- Mixed composer rail: official PNG/JPEG/WebP/GIF thumbs plus 64px cards for other files.
- Drag / paste / paperclip intake; non-images land in `.dsh-uploads/`.
- Sent file cards attach to the user bubble stack; composer rail clears on submit.
- Host injects `webServer` and `sessions`; client injects `slots` only.
