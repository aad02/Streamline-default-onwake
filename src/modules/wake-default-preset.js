// Wake-default-preset policy — which quick-toggle favorite (if any) should be
// force-loaded when the machine wakes from sleep, overriding Decaid's native
// "restore whatever was active before sleep" behavior.
//
// Pure decision logic lives here so it can be unit tested without a DOM (see
// test/wake-default-preset.test.mjs and test/README.md's "DOM-free module"
// convention). Storage is skin-local only — this setting is never sent to the
// machine or to Decaid; only the *result* of applying it (a profile upload)
// is.
//
// DOM-free at import time on purpose so `node --test test/` can import it.
import { getSetting, setSetting } from './idb.js';

const WAKE_DEFAULT_PRESET_KEY = 'wakeDefaultPreset';

/** Sentinel for "keep Decaid's native last-used-profile restore on wake". */
export const WAKE_DEFAULT_LAST_USED = 'last_used';

let currentWakeDefaultPreset = WAKE_DEFAULT_LAST_USED;

/**
 * Is `value` a legal wakeDefaultPreset setting: the last-used sentinel, or an
 * integer favorite slot in range for the current setup?
 * @param {*} value
 * @param {number} slotCount - number of favorite/quick-toggle slots (FAV_COUNT)
 */
export function isValidWakeDefaultPreset(value, slotCount) {
    if (value === WAKE_DEFAULT_LAST_USED) return true;
    // Number(null) === 0 and Number([]) === 0 -- reject non-numeric-ish inputs
    // explicitly instead of letting them coerce into a false "slot 0".
    if (value === null || value === undefined || typeof value === 'object') return false;
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 && n < slotCount;
}

/**
 * Pure: resolve which favorite slot a machine wake should force-load, given
 * the configured setting. Returns null when nothing should override the
 * native last-used restore — either because the setting says so, or because
 * a stored value is out of range for the current slot count (e.g. a config
 * imported from a setup with more slots).
 * @param {'last_used'|number|string} wakeDefaultPreset
 * @param {number} slotCount
 * @returns {number|null}
 */
export function resolveWakeDefaultSlot(wakeDefaultPreset, slotCount) {
    if (!isValidWakeDefaultPreset(wakeDefaultPreset, slotCount)) return null;
    if (wakeDefaultPreset === WAKE_DEFAULT_LAST_USED) return null;
    return Number(wakeDefaultPreset);
}

/** @returns {'last_used'|number} the in-memory preference; call loadWakeDefaultPreset() first to hydrate it. */
export function getWakeDefaultPreset() {
    return currentWakeDefaultPreset;
}

/**
 * Sets and persists the wake-default-preset preference.
 * @param {'last_used'|number|string} value
 * @param {number} slotCount
 * @returns {boolean} false (no-op) if `value` is not a legal setting
 */
export function setWakeDefaultPreset(value, slotCount) {
    if (!isValidWakeDefaultPreset(value, slotCount)) return false;
    currentWakeDefaultPreset = value === WAKE_DEFAULT_LAST_USED ? value : Number(value);
    // Write to both — IDB survives WebView process kills on iOS, localStorage is sync fallback.
    localStorage.setItem(WAKE_DEFAULT_PRESET_KEY, String(currentWakeDefaultPreset));
    setSetting(WAKE_DEFAULT_PRESET_KEY, currentWakeDefaultPreset).catch(() => {});
    return true;
}

/**
 * Restores the persisted preference at startup. Call once, before the first
 * machine-wake edge can occur, so a genuinely-configured preset isn't missed
 * on the app's first wake after launch.
 * @param {number} slotCount
 * @returns {Promise<'last_used'|number>}
 */
export async function loadWakeDefaultPreset(slotCount) {
    let stored = null;
    try {
        stored = await getSetting(WAKE_DEFAULT_PRESET_KEY);
    } catch { /* fall through to localStorage below */ }
    if (stored === null || stored === undefined) {
        const local = localStorage.getItem(WAKE_DEFAULT_PRESET_KEY);
        stored = local === null ? null : (local === WAKE_DEFAULT_LAST_USED ? local : Number(local));
    }
    currentWakeDefaultPreset = isValidWakeDefaultPreset(stored, slotCount) ? stored : WAKE_DEFAULT_LAST_USED;
    return currentWakeDefaultPreset;
}
