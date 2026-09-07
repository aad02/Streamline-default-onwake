// Wake-default-preset: locking a quick-toggle favorite as the profile that
// loads when the machine wakes from sleep, instead of Decaid's native
// restore-whatever-was-active-before-sleep behavior.
//
// Only the pure decision logic is covered here — isValidWakeDefaultPreset and
// resolveWakeDefaultSlot never touch localStorage or IDB, unlike
// getWakeDefaultPreset/setWakeDefaultPreset/loadWakeDefaultPreset (see
// test/README.md's "DOM-free module" convention).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    WAKE_DEFAULT_LAST_USED,
    isValidWakeDefaultPreset,
    resolveWakeDefaultSlot,
} from '../src/modules/wake-default-preset.js';

const FAV_COUNT = 5;

test('the last-used sentinel is always valid, regardless of slot count', () => {
    assert.equal(isValidWakeDefaultPreset(WAKE_DEFAULT_LAST_USED, FAV_COUNT), true);
    assert.equal(isValidWakeDefaultPreset(WAKE_DEFAULT_LAST_USED, 0), true);
});

test('an in-range slot index is valid, as a number or a numeric string', () => {
    for (let i = 0; i < FAV_COUNT; i++) {
        assert.equal(isValidWakeDefaultPreset(i, FAV_COUNT), true, `slot ${i} as number`);
        assert.equal(isValidWakeDefaultPreset(String(i), FAV_COUNT), true, `slot ${i} as string`);
    }
});

test('out-of-range, fractional, and garbage values are all invalid', () => {
    for (const value of [-1, FAV_COUNT, FAV_COUNT + 1, 2.5, NaN, 'nope', null, undefined, {}, []]) {
        assert.equal(isValidWakeDefaultPreset(value, FAV_COUNT), false, `${JSON.stringify(value)} should be invalid`);
    }
});

test('a slot valid under a larger setup is invalid once slots shrink', () => {
    // e.g. settings imported from a setup with more favorite slots than this one.
    assert.equal(isValidWakeDefaultPreset(4, 5), true);
    assert.equal(isValidWakeDefaultPreset(4, 3), false);
});

// --- resolveWakeDefaultSlot: last-used and invalid settings never override --

test('resolveWakeDefaultSlot: last-used never overrides the native restore', () => {
    assert.equal(resolveWakeDefaultSlot(WAKE_DEFAULT_LAST_USED, FAV_COUNT), null);
});

test('resolveWakeDefaultSlot: an invalid or out-of-range setting never overrides', () => {
    assert.equal(resolveWakeDefaultSlot(null, FAV_COUNT), null);
    assert.equal(resolveWakeDefaultSlot(undefined, FAV_COUNT), null);
    assert.equal(resolveWakeDefaultSlot(-1, FAV_COUNT), null);
    assert.equal(resolveWakeDefaultSlot(FAV_COUNT, FAV_COUNT), null);
    assert.equal(resolveWakeDefaultSlot('garbage', FAV_COUNT), null);
});

test('resolveWakeDefaultSlot: a configured slot resolves to its numeric index', () => {
    for (let i = 0; i < FAV_COUNT; i++) {
        assert.equal(resolveWakeDefaultSlot(i, FAV_COUNT), i);
        assert.equal(resolveWakeDefaultSlot(String(i), FAV_COUNT), i, 'a numeric string round-trips the same as its number');
    }
});
