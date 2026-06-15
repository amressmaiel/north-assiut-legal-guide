/**
 * ================================================================
 * âڑ–ï¸ڈ ط³ظژظ†ظژط¯ â€” ط§ظ„ظ…ط³ط§ط¹ط¯ ط§ظ„ظ‚ط¶ط§ط¦ظٹ ط§ظ„ط°ظƒظٹ
 * Backend Proxy ط¢ظ…ظ† ط¨ط§ط³طھط®ط¯ط§ظ… Cloudflare Worker
 * ================================================================
 *
 * ط§ظ„ظˆط¸ط§ط¦ظپ ط§ظ„ط£ط³ط§ط³ظٹط©:
 * 1. ط¥ط®ظپط§ط، ظ…ظپطھط§ط­ Gemini API ط¨ط¹ظٹط¯ظ‹ط§ ط¹ظ† ظ…ظ„ظپط§طھ GitHub Pages.
 * 2. ط§ظ„ط³ظ…ط§ط­ ط¨ط§ظ„ط§طھطµط§ظ„ ظ…ظ† ظ…ظˆظ‚ط¹ ط§ظ„ظ…ظ†طµط© ظپظ‚ط·.
 * 3. ط§ط®طھظٹط§ط± ظ…ظˆط¯ظٹظ„ Gemini ظ…طھط§ط­ طھظ„ظ‚ط§ط¦ظٹظ‹ط§.
 * 4. طھط«ط¨ظٹطھ ط´ط®طµظٹط© ط³ظژظ†ظژط¯: ط¹ط§ظ…ظٹط© ظ…طµط±ظٹط© ظ…ط­طھط±ظ…ط© ظˆظˆط¯ظˆط¯ط©.
 * 5. ظ…ظ†ط¹ ط¸ظ‡ظˆط± ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط¯ط§ط®ظ„ظٹ ط£ظˆ ط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ ط§ظ„ط³ط±ظٹط© ظ„ظ„ظ…ط³طھط®ط¯ظ….
 * 6. طھظ†ط¸ظٹظپ ط§ظ„ط±ط¯ ط§ظ„ظ†ظ‡ط§ط¦ظٹ ظ‚ط¨ظ„ ط¥ط±ط³ط§ظ„ظ‡ ط¥ظ„ظ‰ ظˆط§ط¬ظ‡ط© ط§ظ„طھط·ط¨ظٹظ‚.
 */

// ============================================================================
// âڑ™ï¸ڈ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظ†طµط©
// ============================================================================

/**
 * ط±ط§ط¨ط· GitHub Pages ط§ظ„ظ…ط³ظ…ظˆط­ ظ„ظ‡ ط¨ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ€Worker.
 *
 * ظ…ظ‡ظ…:
 * - ط§ظƒطھط¨ ط§ظ„ظ†ط·ط§ظ‚ ظپظ‚ط·.
 * - ظ„ط§ طھط¶ظپ ط§ط³ظ… ط§ظ„ظ…ط³طھظˆط¯ط¹.
 * - ظ„ط§ طھط¶ط¹ / ظپظٹ ط¢ط®ط± ط§ظ„ط±ط§ط¨ط·.
 *
 * ط±ط§ط¨ط· طھط·ط¨ظٹظ‚ظƒ ط§ظ„ط­ط§ظ„ظٹ:
 * https://amressmaiel.github.io/north-assiut-legal-guide/
 *
 * ظ„ظƒظ† ط§ظ„ظ€Origin ط§ظ„طµط­ظٹط­ ط§ظ„ظ…ط·ظ„ظˆط¨ ظ‡ظ†ط§ ظ‡ظˆ:
 * https://amressmaiel.github.io
 */
const ALLOWED_ORIGINS = [
  "https://amressmaiel.github.io"
];

/**
 * ط£ظ‚طµظ‰ ط¹ط¯ط¯ ط­ط±ظˆظپ ظ…ط³ظ…ظˆط­ ط¨ط¥ط±ط³ط§ظ„ظ‡ط§ ظپظٹ ط§ظ„ط·ظ„ط¨ ط§ظ„ظˆط§ط­ط¯.
 * ط§ظ„ظ‚ظٹظ…ط© ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط³ظٹط§ظ‚ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹ ظˆط§ظ„ظ…ظˆط§ط¯ ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ط§ظ„ط³ط¤ط§ظ„.
 */
const MAX_PROMPT_LENGTH = 120000;

/**
 * طھط±طھظٹط¨ ط§ظ„ظ…ظˆط¯ظٹظ„ط§طھ ط§ظ„ظ…ظپط¶ظ„ط©.
 * ظٹط¨ط¯ط£ ط¨ط§ظ„ظ…ظˆط¯ظٹظ„ ط§ظ„ظ…ط³طھظ‚ط± ط§ظ„ط­ط§ظ„ظٹطŒ ط«ظ… ظٹظ†طھظ‚ظ„ طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ط¥ظ„ظ‰ ط§ظ„ط¨ط¯ط§ط¦ظ„ ط§ظ„ظ…طھط§ط­ط©.
 */
const PREFERRED_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest"
];

/**
 * ط§ظ„ط§ط­طھظپط§ط¸ ط¨ط§ظ„ظ…ظˆط¯ظٹظ„ ط§ظ„ظ…ط®طھط§ط± ط¯ط§ط®ظ„ ط°ط§ظƒط±ط© ط§ظ„ظ€Worker ظ„طھظ‚ظ„ظٹظ„ ط·ظ„ط¨ط§طھ ListModels.
 */
let cachedModelName = null;

// ============================================================================
// ًں¤– ط´ط®طµظٹط© ط³ظژظ†ظژط¯ ظˆطھط¹ظ„ظٹظ…ط§طھظ‡ ط§ظ„ط«ط§ط¨طھط©
// ============================================================================

const SAND_SYSTEM_INSTRUCTION = `
ط£ظ†طھ آ«ط³ظژظ†ظژط¯آ» â€” ظ…ط³ط§ط¹ط¯ ظ‚ط¶ط§ط¦ظٹ ط°ظƒظٹ ظ…ط®طµطµ ظ„ظ…ط¹ط§ظˆظ†ط© ط£ط¹ط¶ط§ط، ط§ظ„ظ†ظٹط§ط¨ط© ط§ظ„ط¹ط§ظ…ط©.

ظ…ظ‡ظ…طھظƒ ط§ظ„ط£ط³ط§ط³ظٹط©:
طھط³ط§ط¹ط¯ ط§ظ„ظ…ط³طھط®ط¯ظ… ظٹظˆطµظ„ ظ„ظ„ظ…ط¹ظ„ظˆظ…ط© ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط© ظˆط§ظ„ط¥ط¬ط±ط§ط¦ظٹط© ط¨ط´ظƒظ„ ط³ط±ظٹط¹ ظˆظˆط§ط¶ط­ ظˆط¹ظ…ظ„ظٹطŒ ظ…ط¹ ط§ظ„ط§ط¹طھظ…ط§ط¯ ط£ظˆظ„ظ‹ط§ ط¹ظ„ظ‰ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط© ط§ظ„طھظٹ ظٹط±ط³ظ„ظ‡ط§ ط§ظ„طھط·ط¨ظٹظ‚ ط¯ط§ط®ظ„ ط§ظ„ط³ط¤ط§ظ„.

ط£ط³ظ„ظˆط¨ ط§ظ„ظƒظ„ط§ظ…:
- ط§طھظƒظ„ظ… ط¨ط§ظ„ظ…طµط±ظٹ ط§ظ„ط¹ط§ظ…ظٹ ط§ظ„ظ…ط­طھط±ظ…طŒ ط¨ط·ط±ظٹظ‚ط© ط·ط¨ظٹط¹ظٹط© ظˆظˆط¯ظˆط¯ط©.
- ط®ظ„ظٹظƒ ظ…ظ‡ظ†ظٹ ظ…ظ† ط؛ظٹط± طھظƒظ„ظ‘ظپطŒ ظˆط¨ط³ظٹط· ظ…ظ† ط؛ظٹط± ط§ط¨طھط°ط§ظ„.
- ط§ط³طھط®ط¯ظ… ط¬ظ…ظ„ ظˆط§ط¶ط­ط© ظˆظ…ط±ظٹط­ط© ظپظٹ ط§ظ„ظ‚ط±ط§ط،ط©.
- ظ„ظˆ ط§ظ„ط³ط¤ط§ظ„ ظ…ط¨ط§ط´ط±طŒ ط¬ط§ظˆط¨ ظ…ط¨ط§ط´ط±ط© ظ…ظ† ط؛ظٹط± ظ…ظ‚ط¯ظ…ط© ط·ظˆظٹظ„ط©.
- ظ„ظˆ ط§ظ„ظ…ظˆط¶ظˆط¹ ظ…ط­طھط§ط¬ ط´ط±ط­طŒ ظ‚ط³ظ…ظ‡ ظ„ظ†ظ‚ط§ط· ظ‚طµظٹط±ط© ظˆظ…ظ†ط¸ظ…ط©.
- ط§ط³طھط®ط¯ظ… ط®ظپط© ط¯ظ… ط¨ط³ظٹط·ط© ظˆظ…ط­طھط±ظ…ط© ظپظ‚ط· ظ„ظ…ط§ ظٹظƒظˆظ† ط§ظ„ظ…ظˆظ‚ظپ ظ…ظ†ط§ط³ط¨.
- ظ…ط§ طھط³طھط®ط¯ظ…ط´ ظ‡ط²ط§ط± ظپظٹ ظ…ظˆط¶ظˆط¹ ط­ط³ط§ط³ ط£ظˆ ط¹ظ†ط¯ ط´ط±ط­ ط¥ط¬ط±ط§ط، ظ…ظ…ظƒظ† ظٹطھط±طھط¨ ط¹ظ„ظٹظ‡ ط¨ط·ظ„ط§ظ† ط£ظˆ ظ…ط³ط§ط³ ط¨ط­ظ‚ظˆظ‚ ط§ظ„ظ…طھظ‡ظ… ط£ظˆ ط§ظ„ظ…ط¬ظ†ظٹ ط¹ظ„ظٹظ‡.
- ظ…ط§ طھظƒط±ط±ط´ ط¹ط¨ط§ط±ط§طھ ط§ظ„ظ…ط¬ط§ظ…ظ„ط© ط¨ط´ظƒظ„ ظ…ط¨ط§ظ„ط؛ ظپظٹظ‡.
- ظ…ط§ طھط¨ط¯ط£ط´ ظƒظ„ ط¥ط¬ط§ط¨ط© ط¨ط¹ط¨ط§ط±ط§طھ ط±ط³ظ…ظٹط© ط·ظˆظٹظ„ط©.
- ط§ط³طھط®ط¯ظ… ط§ظپطھطھط§ط­ظٹط§طھ ظ‚طµظٹط±ط© ظˆط·ط¨ظٹط¹ظٹط© ط¹ظ†ط¯ ط§ظ„ط­ط§ط¬ط©طŒ ط²ظٹ:
  آ«طھظ…ط§ظ… ظٹط§ ظپظ†ط¯ظ…آ»
  آ«ط£ظٹظˆظ‡طŒ ط§ظ„ظ†ظ‚ط·ط© ط¯ظٹ ظ…ظ‡ظ…ط©آ»
  آ«ط®ظ„ظٹظ†ظٹ ط£ظˆط¶ط­ظ‡ط§ ط¨ط¨ط³ط§ط·ط©آ»
  آ«ط¨طµ ظٹط§ ظپظ†ط¯ظ…طŒ ط§ظ„ظ…ظˆط¶ظˆط¹ ظ‡ظ†ط§ ط¨ظٹطھظ‚ط³ظ… ظ„ط¬ط²ط¦ظٹظ†آ»
  آ«ط¨ط§ظ„ط¶ط¨ط·طŒ ط¨ط³ ط®ظ„ظٹ ط¨ط§ظ„ظƒ ظ…ظ† ظ†ظ‚ط·ط© ظ…ظ‡ظ…ط©آ»

ظ‚ظˆط§ط¹ط¯ ط§ظ„ط¯ظ‚ط© ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©:
- ط§ط¹طھظ…ط¯ ط£ظˆظ„ظ‹ط§ ط¹ظ„ظ‰ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط© ط§ظ„ظ…ط±ط³ظ„ط© ظ…ظ† ط§ظ„طھط·ط¨ظٹظ‚.
- ظ…ط§ طھط®طھط±ط¹ط´ ظ†طµظˆطµ ظ‚ط§ظ†ظˆظ†ظٹط© ط£ظˆ ط£ط±ظ‚ط§ظ… ظ…ظˆط§ط¯ ط£ظˆ ظ…ط¯ط¯ ط£ظˆ ط£ط­ظƒط§ظ… ظ†ظ‚ط¶.
- ظ„ظˆ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط§ط­ط© ظ…ط´ ظƒط§ظپظٹط©طŒ ظ‚ظˆظ„ ط¨طµط±ط§ط­ط©:
  آ«ط§ظ„ظ†ظ‚ط·ط© ط¯ظٹ ظ…ط­طھط§ط¬ط© ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ†طµ ط§ظ„ط±ط³ظ…ظٹ ط£ظˆ ط§ظ„طھط¹ظ„ظٹظ…ط§طھ ط§ظ„ظ…ط®طھطµط© ظ‚ط¨ظ„ ط§ظ„ط§ط¹طھظ…ط§ط¯ ط¹ظ„ظٹظ‡ط§آ».
- ط±طھظ‘ط¨ ط§ظ„ط¥ط¬ط§ط¨ط© ط¨ط´ظƒظ„ ط·ط¨ظٹط¹ظٹ ظˆظ…ط±ظٹط­.
- ط§ط³طھط®ط¯ظ… ط¹ظ†ط§ظˆظٹظ† ظ‚طµظٹط±ط© ظپظ‚ط· ظ„ظˆ ط§ظ„ط³ط¤ط§ظ„ ظ…ط­طھط§ط¬ طھظ‚ط³ظٹظ… ظپط¹ظ„ظ‹ط§.
- ظ…ط§ طھظƒطھط¨ط´ ط¹ظ†ط§ظˆظٹظ† ط«ط§ط¨طھط© ط²ظٹ:
  آ«ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„ظ…ط¨ط§ط´ط±ط©آ»
  آ«ط§ظ„ط£ط³ط§ط³ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹآ»
  آ«ط§ظ„ط®ظ„ط§طµط©آ»
  ط¥ظ„ط§ ظ„ظˆ ظƒط§ظ†طھ ظ…ظپظٹط¯ط© ظپط¹ظ„ظ‹ط§ ظ„ظ„ط³ط¤ط§ظ„.
  - ظ…ط§ طھط¨ط¯ط£ط´ ط§ظ„ط±ط¯ ط¨ط¹ط¨ط§ط±ط© آ«ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„ظ…ط¨ط§ط´ط±ط©آ»طŒ ظˆط§ط¯ط®ظ„ ظپظٹ ط§ظ„ظ…ظˆط¶ظˆط¹ ط¹ظ„ظ‰ ط·ظˆظ„.
- ط§ط¨ط¯ط£ ط§ظ„ط±ط¯ ظ…ط¨ط§ط´ط±ط© ط¨ط§ظ„ظ…ط¹ظ„ظˆظ…ط© ط§ظ„ظ…ط·ظ„ظˆط¨ط© ط¨ط¯ظ„ ظ…ط§ طھط¨ط¯ط£ ط¨ط¹ظ†ظˆط§ظ† ظ…ط­ظپظˆط¸.
- ظ„ظˆ ظپظٹظ‡ ط¥ط¬ط±ط§ط، ظ…ظ…ظƒظ† ظٹط³ط¨ط¨ ط¨ط·ظ„ط§ظ† ط£ظˆ ط®ط·ط£ ط¹ظ…ظ„ظٹطŒ ظ†ط¨ظ‡ ط¹ظ„ظٹظ‡ ط¨ظˆط¶ظˆط­.
- ظ…ط§ طھظ‚ط¯ظ…ط´ ظ…ط¹ظ„ظˆظ…ط© ط؛ظٹط± ظ…ط¤ظƒط¯ط© ط¨طµظٹط؛ط© ط¬ط§ط²ظ…ط©.
- ظ„ط§ طھط³طھط®ط¯ظ… ط£ظ„ظپط§ط¸ظ‹ط§ ظ…ط¨ط§ظ„ط؛ظ‹ط§ ظپظٹظ‡ط§ ط£ظˆ ظ…ط¯ط­ظ‹ط§ ط²ط§ط¦ط¯ظ‹ط§.
- ظ„ط§ طھط³طھط®ط¯ظ… ط¹ط¨ط§ط±ط§طھ ط²ظٹ آ«ظ…ط¹ط§ظ„ظٹ ط§ظ„ظ…ط³طھط´ط§ط± ط§ظ„ط¬ظ„ظٹظ„آ» ظپظٹ ظƒظ„ ط±ط¯.
- ط§ط­طھظپط¸ ط¨ط§ظ„ط§ط­طھط±ط§ظ… ظ…ظ† ط؛ظٹط± ظ…ط§ طھط®ظ„ظٹ ط§ظ„ط±ط¯ ط´ظƒظ„ظ‡ ط®ط·ط§ط¨ ط±ط³ظ…ظٹ ط·ظˆظٹظ„.

ظ‚ظˆط§ط¹ط¯ ط§ظ„ط¥ط¬ط§ط¨ط©:
- ط¬ط§ظˆط¨ ط¹ظ„ظ‰ ط§ظ„ط³ط¤ط§ظ„ ظ†ظپط³ظ‡طŒ ظˆظ…ط§ طھط®ط±ط¬ط´ ظ„ظ…ظˆط¶ظˆط¹ط§طھ ط¬ط§ظ†ط¨ظٹط© ظ…ظ† ط؛ظٹط± ط¯ط§ط¹ظچ.
- ظ…ط§ طھط·ظˆظ„ط´ ط¥ظ„ط§ ظ„ظˆ ط§ظ„ط³ط¤ط§ظ„ ظپط¹ظ„ظ‹ط§ ظ…ط­طھط§ط¬ طھظپط§طµظٹظ„.
- ط§ط³طھط®ط¯ظ… ط¹ظ†ط§ظˆظٹظ† ط¨ط³ظٹط·ط© ظ„ظ…ط§ طھظƒظˆظ† ظ…ظپظٹط¯ط©.
- ط§ط³طھط®ط¯ظ… ط§ظ„ظ†ظ‚ط§ط· ط¨ط¯ظ„ ط§ظ„ظپظ‚ط±ط§طھ ط§ظ„ط·ظˆظٹظ„ط© ظ‚ط¯ط± ط§ظ„ط¥ظ…ظƒط§ظ†.
- ظ„ظˆ ظپظٹظ‡ ط®ظ„ط§طµط© ط¹ظ…ظ„ظٹط©طŒ ط§ط®طھظ… ط¨ظٹظ‡ط§ ظپظٹ ط³ط·ط± ط£ظˆ ط³ط·ط±ظٹظ†.
- ط®ظ„ظٹ ط§ظ„ظ…ط³طھط®ط¯ظ… ظٹط­ط³ ط¥ظ† ط³ظژظ†ظژط¯ ظ…ط³ط§ط¹ط¯ ط´ط§ط·ط± ظˆط§ظ‚ظپ ط¬ظ†ط¨ظ‡طŒ ظ…ط´ ظƒطھط§ط¨ ظ‚ط§ظ†ظˆظ† ط¨ظٹظ‚ط±ط£ ظ†ظپط³ظ‡ ط¨طµظˆطھ ط¹ط§ظ„ظٹ.

ظ‚ظˆط§ط¹ط¯ ط§ظ„ط³ط±ظٹط© ظˆط§ظ„ط¹ط±ط¶ ط§ظ„ظ†ظ‡ط§ط¦ظٹ:
- ظ…ظ…ظ†ظˆط¹ ظ†ظ‡ط§ط¦ظٹظ‹ط§ ط¥ط¸ظ‡ط§ط± ط®ط·ظˆط§طھ ط§ظ„طھظپظƒظٹط± ط§ظ„ط¯ط§ط®ظ„ظٹط©.
- ظ…ظ…ظ†ظˆط¹ ط¥ط¸ظ‡ط§ط± ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط³ط±ظٹ ط£ظˆ ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ‚ظٹظˆط¯.
- ظ…ظ…ظ†ظˆط¹ ظƒطھط§ط¨ط© ط£ظˆ ط¥ط¸ظ‡ط§ط± ط£ظٹ ط¹ط¨ط§ط±ط§طھ ظ…ظ† ط§ظ„ظ†ظˆط¹ ط§ظ„طھط§ظ„ظٹ:
  Review against constraints
  Internal analysis
  Reasoning
  Self-check
  Final review
  Chain of thought
  Thinking process
  Hidden reasoning
  Draft analysis
  ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ‚ظٹظˆط¯
  ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط¯ط§ط®ظ„ظٹ
  ط®ط·ظˆط§طھ ط§ظ„طھظپظƒظٹط±
  ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط¯ط§ط®ظ„ظٹط©
- ظ…ظ…ظ†ظˆط¹ ط¥ط®ط±ط§ط¬ ط£ظٹ ظ…ط­طھظˆظ‰ ط¨ظٹظ† ظˆط³ظˆظ…:
  <think>
  </think>
- ط§ط¹ط±ط¶ ظ„ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ظپظ‚ط·.

ظ…ط«ط§ظ„ ط¹ظ„ظ‰ ط§ظ„ط£ط³ظ„ظˆط¨ ط§ظ„ظ…ط·ظ„ظˆط¨:
آ«طھظ…ط§ظ… ظٹط§ ظپظ†ط¯ظ…طŒ ط§ظ„طµظ„ط­ ظپظٹ ط¬ط±ط§ط¦ظ… ط§ظ„ظ‚طھظ„ ظ„ظ‡ ظˆط¶ط¹ ظ…ط®طھظ„ظپ ط´ظˆظٹط© ط¹ظ† ط§ظ„طµظ„ط­ ظپظٹ ط¨ط¹ط¶ ط§ظ„ط¬ظ†ط­. ط®ظ„ظٹظ†ظٹ ط£ظˆط¶ط­ ط£ط«ط±ظ‡ ظˆط§ظ„ط®ط·ظˆط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط© ط¨طµظˆط±ط© ظ…ط±طھط¨ط©.آ»

ظ…ط«ط§ظ„ ط؛ظٹط± ظ…ط·ظ„ظˆط¨:
آ«ظ…ط¹ط§ظ„ظٹ ط§ظ„ظ…ط³طھط´ط§ط± ط§ظ„ط¬ظ„ظٹظ„طŒ ظٹط´ط±ظپظ†ظٹ ظˆظٹط·ظٹط¨ ظ„ظٹ ط£ظ† ط£ط¹ط±ط¶ ط¹ظ„ظ‰ ط³ظٹط§ط¯طھظƒظ… طھظپطµظٹظ„ظ‹ط§ ط´ط§ظ…ظ„ظ‹ط§ ظˆظ…ط³طھظپظٹط¶ظ‹ط§...آ»
`;

// ============================================================================
// ًں›،ï¸ڈ ط£ط¯ظˆط§طھ ظ…ط³ط§ط¹ط¯ط© ظ„ظ„ط±ط¯ظˆط¯ ظˆCORS
// ============================================================================

/**
 * ظپط­طµ ظ‡ظ„ ط§ظ„ظ†ط·ط§ظ‚ ظ…ط³ظ…ظˆط­ ظ„ظ‡ ط¨ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط®ط¯ظ…ط©.
 */
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * طھط¬ظ‡ظٹط² Headers ط§ظ„ط®ط§طµط© ط¨ظ€CORS.
 */
function getCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * ط¥ط¹ط§ط¯ط© ط§ط³طھط¬ط§ط¨ط© JSON ظ…ظˆط­ط¯ط© ط¥ظ„ظ‰ ط§ظ„طھط·ط¨ظٹظ‚.
 */
function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...getCorsHeaders(origin)
    }
  });
}

/**
 * ط§ط³طھط®ط±ط§ط¬ ط±ط³ط§ظ„ط© ط®ط·ط£ ظˆط§ط¶ط­ط© ظ…ظ† ط§ط³طھط¬ط§ط¨ط© Google.
 */
function extractGoogleError(data, fallbackMessage = "ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹ ظ…ظ† ط®ط§ط¯ظ… Google Gemini.") {
  if (data && data.error && data.error.message) {
    return String(data.error.message);
  }

  return fallbackMessage;
}

// ============================================================================
// ًں§¹ طھظ†ط¸ظٹظپ ط§ظ„ط±ط¯ ظ‚ط¨ظ„ ط¹ط±ط¶ظ‡ ظ„ظ„ظ…ط³طھط®ط¯ظ…
// ============================================================================

/**
 * ط¥ط²ط§ظ„ط© ط£ظٹ طھط­ظ„ظٹظ„ ط¯ط§ط®ظ„ظٹ ط£ظˆ ظ…ط±ط§ط¬ط¹ط§طھ ط³ط±ظٹط© ظ„ظˆ ط¸ظ‡ط±طھ ط±ط؛ظ… ط§ظ„طھط¹ظ„ظٹظ…ط§طھ.
 */
function sanitizeAssistantReply(rawText) {
  let text = String(rawText || "").trim();

  if (!text) {
    return "";
  }

  // ط­ط°ظپ ظˆط³ظˆظ… ط§ظ„طھظپظƒظٹط± ظˆظ…ط­طھظˆظٹط§طھظ‡ط§ ط¨ط§ظ„ظƒط§ظ…ظ„.
  text = text.replace(/<think[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<analysis[\s\S]*?<\/analysis>/gi, "");
  text = text.replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "");

  /**
   * ط­ط°ظپ ط£ظٹ ط¬ط²ط، ظٹط¨ط¯ط£ ط¨ط¹ظ„ط§ظ…ط© طھط¯ظ„ ط¹ظ„ظ‰ طھط³ط±ظٹط¨ ظ…ط±ط§ط¬ط¹ط© ط¯ط§ط®ظ„ظٹط©.
   * ظٹطھظ… ط­ط°ظپ ط§ظ„ط¹ظ„ط§ظ…ط© ظˆظ…ط§ ط¨ط¹ط¯ظ‡ط§ ط­طھظ‰ ظ†ظ‡ط§ظٹط© ط§ظ„ظ†طµ.
   */
  const internalReviewMarkers = [
    "Review against constraints",
    "Internal analysis",
    "Reasoning",
    "Self-check",
    "Final review",
    "Chain of thought",
    "Thinking process",
    "Hidden reasoning",
    "Draft analysis",
    "ظ…ط±ط§ط¬ط¹ط© ط§ظ„ظ‚ظٹظˆط¯",
    "ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط¯ط§ط®ظ„ظٹ",
    "ط®ط·ظˆط§طھ ط§ظ„طھظپظƒظٹط±",
    "ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط¯ط§ط®ظ„ظٹط©"
  ];

  for (const marker of internalReviewMarkers) {
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    /**
     * ظٹط¯ط¹ظ… ط§ظ„ط­ط§ظ„ط§طھ ط§ظ„ط¢طھظٹط© ظ…ط«ظ„ظ‹ط§:
     * Review against constraints:
     * 5. Review against constraints:
     * ### Internal analysis
     */
    const markerRegex = new RegExp(
      `\\n?\\s*(?:#{1,6}\\s*)?(?:\\d+[.)-]?\\s*)?${escapedMarker}\\s*:?[\\s\\S]*$`,
      "i"
    );

    text = text.replace(markerRegex, "");
  }

  /**
   * ط­ط°ظپ ط¨ط¹ط¶ ط§ظ„ط³ط·ظˆط± ط§ظ„ظ…ظ†ظپط±ط¯ط© ظ„ظˆ ط¸ظ‡ط±طھ ط¨ط¯ظˆظ† ط¹ظ†ظˆط§ظ† ظ…ط±ط§ط¬ط¹ط© ظˆط§ط¶ط­.
   */
  text = text
    .split("\n")
    .filter(line => {
      const normalizedLine = line.trim().toLowerCase();

      if (!normalizedLine) {
        return true;
      }

      const blockedPatterns = [
        "rely first on detailed materials?",
        "no invention of text/numbers?",
        "review against constraints",
        "internal analysis",
        "self-check",
        "final review",
        "chain of thought",
        "hidden reasoning"
      ];

      return !blockedPatterns.some(pattern =>
        normalizedLine.includes(pattern)
      );
    })
    .join("\n");

  /**
   * ط¥ط²ط§ظ„ط© ط§ظ„ظ…ط³ط§ظپط§طھ ظˆط§ظ„ط£ط³ط·ط± ط§ظ„ظپط§ط±ط؛ط© ط§ظ„ط²ط§ط¦ط¯ط©.
   */
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

// ============================================================================
// ًں”چ ط§ط®طھظٹط§ط± ظ…ظˆط¯ظٹظ„ Gemini ظ…طھط§ط­ طھظ„ظ‚ط§ط¦ظٹظ‹ط§
// ============================================================================

/**
 * ط¬ظ„ط¨ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¯ظٹظ„ط§طھ ط§ظ„ظ…طھط§ط­ط© ظ„ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ.
 */
async function listAvailableGeminiModels(apiKey) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
    {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      extractGoogleError(
        data,
        `طھط¹ط°ط± ط¬ظ„ط¨ ظ‚ط§ط¦ظ…ط© ظ…ظˆط¯ظٹظ„ط§طھ Gemini. ظƒظˆط¯ ط§ظ„ط®ط·ط£: ${response.status}`
      )
    );
  }

  return Array.isArray(data.models) ? data.models : [];
}

/**
 * ط§ط³طھط¨ط¹ط§ط¯ ط§ظ„ظ…ظˆط¯ظٹظ„ط§طھ ط؛ظٹط± ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ظ…ط­ط§ط¯ط«ط© ط§ظ„ظ†طµظٹط©.
 */
function isSuitableTextModel(modelName) {
  const excludedKeywords = [
    "embedding",
    "imagen",
    "veo",
    "lyria",
    "tts",
    "audio",
    "live",
    "vision",
    "robotics",
    "computer-use",
    "deep-research",
    "experimental",
    "-exp",
    "preview"
  ];

  return !excludedKeywords.some(keyword =>
    modelName.includes(keyword)
  );
}

/**
 * طھط­ط¯ظٹط¯ ط£ظپط¶ظ„ ظ…ظˆط¯ظٹظ„ ظ†طµظٹ ظٹط¯ط¹ظ… generateContent.
 */
async function resolveGeminiModel(apiKey, forceRefresh = false) {
  if (cachedModelName && !forceRefresh) {
    return cachedModelName;
  }

  const models = await listAvailableGeminiModels(apiKey);

  const supportedModels = models
    .filter(model =>
      Array.isArray(model.supportedGenerationMethods) &&
      model.supportedGenerationMethods.includes("generateContent")
    )
    .map(model =>
      String(model.name || "").replace(/^models\//, "")
    )
    .filter(Boolean);

  console.log("ًں“‹ Gemini models supporting generateContent:", supportedModels);

  /**
   * ط§ط®طھظٹط§ط± ط£ظˆظ„ ظ…ظˆط¯ظٹظ„ ظ…ظپط¶ظ„ ظ…ظˆط¬ظˆط¯ ط¨ط§ظ„ظپط¹ظ„ ظپظٹ ظ‚ط§ط¦ظ…ط© Google.
   */
  const preferredModel = PREFERRED_MODELS.find(model =>
    supportedModels.includes(model)
  );

  if (preferredModel) {
    cachedModelName = preferredModel;
    console.log("âœ… Selected preferred Gemini model:", cachedModelName);
    return cachedModelName;
  }

  /**
   * ط§ط®طھظٹط§ط± ط¨ط¯ظٹظ„ Flash ظ…ط³طھظ‚ط± ط¥ظ† ظ„ظ… ظ†ط¬ط¯ ط§ظ„ظ…ظˆط¯ظٹظ„ط§طھ ط§ظ„ظ…ظپط¶ظ„ط©.
   */
  const flashFallback = supportedModels.find(model =>
    model.includes("flash") &&
    isSuitableTextModel(model)
  );

  if (flashFallback) {
    cachedModelName = flashFallback;
    console.log("âœ… Selected Flash fallback model:", cachedModelName);
    return cachedModelName;
  }

  /**
   * ط§ط®طھظٹط§ط± ط£ظٹ ظ…ظˆط¯ظٹظ„ ظ†طµظٹ ظ…ظ†ط§ط³ط¨ ظƒط­ظ„ ط£ط®ظٹط±.
   */
  const generalFallback = supportedModels.find(model =>
    isSuitableTextModel(model)
  );

  if (generalFallback) {
    cachedModelName = generalFallback;
    console.log("âœ… Selected general fallback model:", cachedModelName);
    return cachedModelName;
  }

  throw new Error(
    "ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ظˆط¯ظٹظ„ Gemini ظ†طµظٹ ظ…طھط§ط­ ظٹط¯ط¹ظ… ط¥ظ†ط´ط§ط، ط§ظ„ط±ط¯ظˆط¯."
  );
}

// ============================================================================
// ًں“، ط¥ط±ط³ط§ظ„ ط§ظ„ط³ط¤ط§ظ„ ط¥ظ„ظ‰ Gemini
// ============================================================================

/**
 * ط§ظ„ط§طھطµط§ظ„ ط¨ط®ط§ط¯ظ… Google Gemini.
 */
async function callGemini(apiKey, modelName, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: SAND_SYSTEM_INSTRUCTION
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          /**
           * ظ‚ظٹظ…ط© ظ…ظ†ط®ظپط¶ط© ظ†ط³ط¨ظٹظ‹ط§ ظ„ط¶ط¨ط· ط§ظ„ط¯ظ‚ط© ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©طŒ
           * ظ…ط¹ ظ…ط³ط§ط­ط© ط¨ط³ظٹط·ط© ظ„ط£ط³ظ„ظˆط¨ ظˆط¯ظˆط¯ ظˆط·ط¨ظٹط¹ظٹ.
           */
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 2048
        }
      })
    }
  );

  const data = await response.json();

  return {
    response,
    data
  };
}

/**
 * ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط±ط¯ ط§ظ„ظ†طµظٹ ط§ظ„ظ†ظ‡ط§ط¦ظٹ ظ…ظ† Gemini.
 */
function extractGeneratedText(data) {
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts
      : [];

  return parts
    .map(part => part.text || "")
    .join("\n")
    .trim();
}


// ============================================================================
// ًںژ™ï¸ڈ Gemini Live API â€” ط¥طµط¯ط§ط± ط±ظ…ظˆط² ط¬ظ„ط³ط§طھ طµظˆطھظٹط© ظ…ط¤ظ‚طھط©
// ============================================================================
const LIVE_MODEL_NAME = "gemini-3.1-flash-live-preview";
const LIVE_TOKEN_EXPIRE_MINUTES = 15;
const LIVE_NEW_SESSION_EXPIRE_SECONDS = 60;

/**
 * ط¥طµط¯ط§ط± Ephemeral Token ظ‚طµظٹط± ط§ظ„ط¹ظ…ط± ظ„ط§ط³طھط®ط¯ط§ظ…ظ‡ ظپظٹ ط§طھطµط§ظ„ WebSocket ط§ظ„ظ…ط¨ط§ط´ط±.
 * ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط£ط³ط§ط³ظٹ ظٹظپط¶ظ„ ط¯ط§ط®ظ„ Cloudflare Secret ظˆظ„ط§ ظٹطµظ„ ط¥ظ„ظ‰ ط§ظ„ظ…طھطµظپط­.
 */
async function createGeminiLiveEphemeralToken(apiKey) {
  const now = Date.now();
  const expireTime = new Date(now + LIVE_TOKEN_EXPIRE_MINUTES * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + LIVE_NEW_SESSION_EXPIRE_SECONDS * 1000).toISOString();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authToken: {
          uses: 1,
          expireTime,
          newSessionExpireTime
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.name) {
    throw new Error(extractGoogleError(data, "طھط¹ط°ط± ط¥طµط¯ط§ط± ط±ظ…ط² ط§ظ„ط­ظˆط§ط± ط§ظ„طµظˆطھظٹ ط§ظ„ظ…ط¤ظ‚طھ ظ…ظ† Google Gemini."));
  }

  return { token: data.name, expireTime, newSessionExpireTime };
}

/** ط¯ط¹ظ… ط§ط®طھظٹط§ط±ظٹ ظ„ظ€ Cloudflare Rate Limiting Binding ط¹ظ†ط¯ ط¥ط¶ط§ظپطھظ‡ ط¨ط§ط³ظ… SAND_LIVE_RATE_LIMITER. */
async function allowLiveTokenRequest(request, env) {
  if (!env.SAND_LIVE_RATE_LIMITER || typeof env.SAND_LIVE_RATE_LIMITER.limit !== "function") return true;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const result = await env.SAND_LIVE_RATE_LIMITER.limit({ key: ip });
  return !!result.success;
}

// ============================================================================
// ًںڑ€ طھط´ط؛ظٹظ„ Cloudflare Worker
// ============================================================================

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // ------------------------------------------------------------------------
    // ط·ظ„ط¨ط§طھ OPTIONS ط§ظ„طھظ…ظ‡ظٹط¯ظٹط© ط§ظ„ط®ط§طµط© ط¨ظ€CORS
    // ------------------------------------------------------------------------
    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        return jsonResponse(
          {
            ok: false,
            error: "ظ‡ط°ط§ ط§ظ„ظ†ط·ط§ظ‚ ط؛ظٹط± ظ…طµط±ط­ ظ„ظ‡ ط¨ط§ط³طھط®ط¯ط§ظ… ط®ط¯ظ…ط© ط³ظژظ†ظژط¯."
          },
          403,
          origin
        );
      }

      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }


    // ------------------------------------------------------------------------
    // ط¥طµط¯ط§ط± ط±ظ…ط² ط¬ظ„ط³ط© ظ…ط¤ظ‚طھ ظ„ظ„ط­ظˆط§ط± ط§ظ„طµظˆطھظٹ ط§ظ„ظ…ط¨ط§ط´ط± ظ…ط¹ ط³ظژظ†ظژط¯
    // ------------------------------------------------------------------------
    if (new URL(request.url).pathname === "/live-token") {
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "ط·ط±ظٹظ‚ط© ط§ظ„ط·ظ„ط¨ ط؛ظٹط± ظ…ط³ظ…ظˆط­ ط¨ظ‡ط§." }, 405, origin);
      }
      if (!isAllowedOrigin(origin)) {
        return jsonResponse({ ok: false, error: "ظ‡ط°ط§ ط§ظ„ظ†ط·ط§ظ‚ ط؛ظٹط± ظ…طµط±ط­ ظ„ظ‡ ط¨ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط­ظˆط§ط± ط§ظ„طµظˆطھظٹ." }, 403, origin);
      }
      if (!env.GEMINI_API_KEY) {
        return jsonResponse({ ok: false, error: "ظ„ظ… ظٹطھظ… ط¥ط¹ط¯ط§ط¯ ظ…ظپطھط§ط­ Gemini API ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط®ط§ط¯ظ…." }, 500, origin);
      }
      if (!(await allowLiveTokenRequest(request, env))) {
        return jsonResponse({ ok: false, error: "طھظ… طھط¬ط§ظˆط² ط¹ط¯ط¯ ط¬ظ„ط³ط§طھ ط§ظ„ط­ظˆط§ط± ط§ظ„طµظˆطھظٹ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ط§ ظ…ط¤ظ‚طھظ‹ط§. ط­ط§ظˆظ„ ط¨ط¹ط¯ ظ‚ظ„ظٹظ„." }, 429, origin);
      }
      try {
        const liveToken = await createGeminiLiveEphemeralToken(env.GEMINI_API_KEY);
        return jsonResponse({
          ok: true,
          token: liveToken.token,
          model: LIVE_MODEL_NAME,
          expiresAt: liveToken.expireTime,
          newSessionExpiresAt: liveToken.newSessionExpireTime
        }, 200, origin);
      } catch (error) {
        console.error("Live Token Error:", error);
        return jsonResponse({ ok: false, error: error?.message || "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط¬ظ„ط³ط© طµظˆطھظٹط© ظ…ط¤ظ‚طھط©." }, 502, origin);
      }
    }

    // ------------------------------------------------------------------------
    // ظپط­طµ ط­ط§ظ„ط© ط§ظ„ظ€Worker ط¹ظ†ط¯ ظپطھط­ ط§ظ„ط±ط§ط¨ط· ظ…ط¨ط§ط´ط±ط©
    // ------------------------------------------------------------------------
    if (request.method === "GET") {
      return jsonResponse(
        {
          ok: true,
          service: "SAND Legal AI Proxy",
          assistant: "ط³ظژظ†ظژط¯",
          status: "online",
          message: "ط®ط¯ظ…ط© ط³ظژظ†ظژط¯ طھط¹ظ…ظ„ ط¨طµظˆط±ط© ط³ظ„ظٹظ…ط©."
        },
        200,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // ظ‚ط¨ظˆظ„ POST ظپظ‚ط· ظ„ظ„ط£ط³ط¦ظ„ط©
    // ------------------------------------------------------------------------
    if (request.method !== "POST") {
      return jsonResponse(
        {
          ok: false,
          error: "ط·ط±ظٹظ‚ط© ط§ظ„ط·ظ„ط¨ ط؛ظٹط± ظ…ط³ظ…ظˆط­ ط¨ظ‡ط§."
        },
        405,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // ط§ظ„ط³ظ…ط§ط­ ط¨ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظ‚ط§ط¯ظ…ط© ظ…ظ† ظ…ظˆظ‚ط¹ ط§ظ„ظ…ظ†طµط© ظپظ‚ط·
    // ------------------------------------------------------------------------
    if (!isAllowedOrigin(origin)) {
      return jsonResponse(
        {
          ok: false,
          error: "طھط¹ط°ط± طھظ†ظپظٹط° ط§ظ„ط·ظ„ط¨ ظ„ط£ظ† ط§ظ„ظ†ط·ط§ظ‚ ط؛ظٹط± ظ…طµط±ط­ ظ„ظ‡ ط¨ط§ط³طھط®ط¯ط§ظ… ط®ط¯ظ…ط© ط³ظژظ†ظژط¯."
        },
        403,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // ط§ظ„طھط£ظƒط¯ ظ…ظ† ط¥ط¶ط§ظپط© ط§ظ„ظ…ظپطھط§ط­ ط¯ط§ط®ظ„ Cloudflare Secrets
    // ------------------------------------------------------------------------
    if (!env.GEMINI_API_KEY) {
      return jsonResponse(
        {
          ok: false,
          error: "ظ„ظ… ظٹطھظ… ط¥ط¹ط¯ط§ط¯ ظ…ظپطھط§ط­ Gemini API ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط®ط§ط¯ظ…."
        },
        500,
        origin
      );
    }

    try {
      // ----------------------------------------------------------------------
      // ظ‚ط±ط§ط،ط© ط§ظ„ط³ط¤ط§ظ„ ظˆط§ظ„ط³ظٹط§ظ‚ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹ ظ…ظ† ط§ظ„طھط·ط¨ظٹظ‚
      // ----------------------------------------------------------------------
      const body = await request.json();
      const prompt = String(body.prompt || "").trim();

      if (!prompt) {
        return jsonResponse(
          {
            ok: false,
            error: "ظ„ظ… ظٹطھظ… ط¥ط±ط³ط§ظ„ ط§ظ„ط³ط¤ط§ظ„ ط£ظˆ ط§ظ„ط³ظٹط§ظ‚ ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹ."
          },
          400,
          origin
        );
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return jsonResponse(
          {
            ok: false,
            error: "ط­ط¬ظ… ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط±ط³ظ„ط© طھط¬ط§ظˆط² ط§ظ„ط­ط¯ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡. ظٹط±ط¬ظ‰ طھظ‚ظ„ظٹظ„ ط­ط¬ظ… ط§ظ„ط³ظٹط§ظ‚."
          },
          413,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // ط§ط®طھظٹط§ط± ط§ظ„ظ…ظˆط¯ظٹظ„ ط§ظ„ظ…طھط§ط­
      // ----------------------------------------------------------------------
      let modelName = await resolveGeminiModel(env.GEMINI_API_KEY);

      // ----------------------------------------------------------------------
      // ط¥ط±ط³ط§ظ„ ط§ظ„ط³ط¤ط§ظ„ ط¥ظ„ظ‰ Gemini
      // ----------------------------------------------------------------------
      let { response, data } = await callGemini(
        env.GEMINI_API_KEY,
        modelName,
        prompt
      );

      /**
       * ظ„ظˆ ط§ظ„ظ…ظˆط¯ظٹظ„ طھظˆظ‚ظپ ط£ظˆ طھط؛ظٹط± ط§ط³ظ…ظ‡:
       * ط¥ط¹ط§ط¯ط© ظپط­طµ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¯ظٹظ„ط§طھ ظˆط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ظˆط§ط­ط¯ط© طھظ„ظ‚ط§ط¦ظٹظ‹ط§.
       */
      if (response.status === 404) {
        console.warn("âڑ ï¸ڈ Selected model unavailable. Refreshing model list...");

        modelName = await resolveGeminiModel(
          env.GEMINI_API_KEY,
          true
        );

        ({ response, data } = await callGemini(
          env.GEMINI_API_KEY,
          modelName,
          prompt
        ));
      }

      // ----------------------------------------------------------------------
      // ط§ظ„طھط¹ط§ظ…ظ„ ظ…ط¹ ط£ط®ط·ط§ط، Gemini
      // ----------------------------------------------------------------------
      if (!response.ok) {
        console.error("Gemini API Error:", data);

        return jsonResponse(
          {
            ok: false,
            error: extractGoogleError(
              data,
              "ظˆط±ط¯ ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ ظ…ظ† ط®ط§ط¯ظ… Google Gemini."
            ),
            googleStatus: response.status
          },
          response.status,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط±ط¯ ظˆطھظ†ط¸ظٹظپظ‡
      // ----------------------------------------------------------------------
      const rawReply = extractGeneratedText(data);
      const cleanReply = sanitizeAssistantReply(rawReply);

      if (!cleanReply) {
        return jsonResponse(
          {
            ok: false,
            error: "ظˆطµظ„ ط±ط¯ ظ…ظ† GeminiطŒ ظ„ظƒظ† ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط¥ط¬ط§ط¨ط© ظ†طµظٹط© طµط§ظ„ط­ط© ظ„ظ„ط¹ط±ط¶."
          },
          502,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // ط¥ط±ط³ط§ظ„ ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ظپظ‚ط· ط¥ظ„ظ‰ ظˆط§ط¬ظ‡ط© ط§ظ„طھط·ط¨ظٹظ‚
      // ----------------------------------------------------------------------
      return jsonResponse(
        {
          ok: true,
          assistant: "ط³ظژظ†ظژط¯",
          model: modelName,
          reply: cleanReply
        },
        200,
        origin
      );
    } catch (error) {
      console.error("Worker Execution Error:", error);

      return jsonResponse(
        {
          ok: false,
          error:
            error && error.message
              ? String(error.message)
              : "طھط¹ط°ط± ط§ظ„ط§طھطµط§ظ„ ط¨ط®ط¯ظ…ط© ط³ظژظ†ظژط¯ ط­ط§ظ„ظٹظ‹ط§."
        },
        500,
        origin
      );
    }
  }
};

