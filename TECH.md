# TECH.md

Chosen after implementation, based on genuine relevance surfaced while building the project — not pre-selected.

## Mongoose 9 (specifically: the removal of the `next()` callback from document middleware)

### What is it?

Mongoose is the ODM this project uses for MongoDB (`Chat` model, conversation persistence, Recent Chats). This project runs `mongoose@9.9.3` — the newest major version — and the change that's actually relevant here isn't a headline feature, it's a breaking change in how middleware works: `pre()`/`post()` hooks (e.g. `pre('validate')`, `pre('save')`) no longer receive the legacy `next` callback argument at all. Hooks are now expected to be synchronous or to return a Promise; Mongoose's internal middleware runner (`kareem`) simply calls the hook function with no `next` parameter.

This isn't secondhand knowledge — I hit it directly. `chat.model.js`'s title-generation hook was written the "classic" way (`function (next) { ...; next(); }`). Under Mongoose 9, `next` was `undefined`, so every single chat save threw `TypeError: next is not a function`. The really instructive part: the app *looked* fine — the AI response still came back, because the save failure was (correctly) caught non-fatally — so the bug only showed up as `chatId` always being `null`. I confirmed the root cause with a standalone reproduction script rather than guessing, then fixed the hook to the callback-free signature.

### How could Stunning use it?

Stunning is already using it — it's the persistence layer for this AI builder's chat history. More broadly, for prototype/MVP-style products like this one, Mongoose's schema flexibility is a good fit for iterating fast on a shape (a `Chat` with a growing `messages` array, in this case) without a migration cycle. If Stunning standardizes on Mongoose across builder-style products, v9's Promise/async-first middleware API is arguably the more idiomatic direction for modern Node — worth adopting deliberately rather than by accident.

### What are its limitations?

- **The breaking change is silent, not loud.** There's no deprecation warning, no crash at startup, no lint error — just a runtime exception the first time a hook using the old signature actually runs, and if that exception is anywhere near error-handling code (as it was here), it can be swallowed and misread as an unrelated problem (e.g. "the database must be unreachable") instead of what it actually is.
- **Existing documentation, tutorials, and AI-generated code (including code I initially wrote for this project) still default to the old callback-style hook signature.** That's a real adoption/DX cost for teams migrating, since the wrong-but-plausible-looking pattern is still what most reference material shows.
- **Being very recent, it has less community battle-testing** than Mongoose 7/8 — fewer Stack Overflow answers, fewer edge cases publicly discovered yet. My own testing here covered exactly one hook type; I wouldn't assume every other middleware pattern (query middleware, aggregate middleware, plugin-injected hooks) behaves identically without verifying each one individually.

### Would you use it today? Why or why not?

Yes — it's already what's running this project, it works well once configured correctly, and the underlying direction (Promise-native middleware over callback-passing) is a genuine improvement, not change for its own sake. But I'd adopt it deliberately, not casually:

- Before or during any upgrade to v9, audit every `pre`/`post` hook in the codebase by hand — don't assume old hook code "probably still works," because in my case it silently didn't.
- For anything relying on middleware, add a small direct-reproduction check (the kind of standalone script I used to root-cause this) as a one-time verification step, since the failure mode here doesn't announce itself through normal error logs or manual testing of the happy path.

---

*Reviewed after the validation/security pass in `DECISIONS.md` (rate limiting via `express-rate-limit`, CORS tightening) — neither change touches persistence or Mongoose, so the analysis above is unchanged. `express-rate-limit` wasn't considered for this slot: it's a mature, unremarkable library, not a genuinely new technology, so it belongs in `DECISIONS.md` as a fix, not here as a pick.*
