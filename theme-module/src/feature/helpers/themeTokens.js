/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *
 * Single source of truth for every themeable token. The PHP side
 * (ModuleOpenWrtHelper::DEFAULT_THEME + the token->css-var map) mirrors
 * these keys exactly, so the live preview in the browser and the CSS the
 * router writes to disk come out identical.
 */
import { PINK, BLUE } from '@module/colors';

/**
 * Logical groups shown as sections in the editor.
 */
export const TOKEN_GROUPS = [
    { id: 'base', label: 'Base & Surfaces' },
    { id: 'brand', label: 'Brand & Accents' },
    { id: 'sidebar', label: 'Sidebar' },
];

/**
 * Every editable color token. `key` is what gets persisted; `group` places
 * it in the editor; `help` is the one-line hint under the swatch.
 */
export const TOKENS = [
    { key: 'bodyBg', group: 'base', label: 'Page background', help: 'Main app background behind every panel.' },
    { key: 'bodyColor', group: 'base', label: 'Body text', help: 'Default foreground text color.' },
    { key: 'surface', group: 'base', label: 'Card / panel', help: 'Background of cards, panels and inputs.' },
    { key: 'border', group: 'base', label: 'Borders', help: 'Card edges, dividers and input outlines.' },

    { key: 'primary', group: 'brand', label: 'Primary', help: 'Buttons, links and active states.' },
    { key: 'accentPink', group: 'brand', label: 'Accent — pink', help: 'ZeroDay highlight (allow-listed MACs, SSIDs).' },
    { key: 'accentBlue', group: 'brand', label: 'Accent — blue', help: 'Secondary highlight (BSSIDs, subtitles).' },

    { key: 'sidebarBg', group: 'sidebar', label: 'Sidebar background', help: 'Fill behind the navigation rail.' },
    { key: 'sidebarText', group: 'sidebar', label: 'Sidebar text', help: 'Default nav link color.' },
];

/**
 * Appearance modes map to Bootstrap 5.3 color modes. `auto` follows the OS.
 */
export const MODES = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'auto', label: 'Auto (system)' },
];

/**
 * Sidebar/module icon palette. Each custom module ships 3 pre-rendered
 * variants (icon-dark.png / icon-light.png / icon-colored.png); switching
 * this just copies the chosen variant over icon.png server-side.
 */
export const ICON_STYLES = [
    { id: 'colored', label: 'Colored', help: 'Pink chip, white glyph — the branded look.' },
    { id: 'dark', label: 'Dark', help: 'Black chip, white glyph — understated, works anywhere.' },
    { id: 'light', label: 'Light', help: 'White chip, dark glyph — for light theme panels.' },
];

/**
 * The factory default — the current ZeroDay Advisory look. Reset restores
 * exactly this.
 */
export const DEFAULT_THEME = {
    mode: 'dark',
    iconStyle: 'colored',
    colors: {
        bodyBg: '#0b0f14',
        bodyColor: PINK,
        surface: '#121821',
        border: '#263040',
        primary: PINK,
        accentPink: PINK,
        accentBlue: BLUE,
        sidebarBg: '#0b0f14',
        sidebarText: PINK,
    },
    images: {
        banner: null,
        background: null,
        bgOpacity: 0.15,
    },
};

/**
 * Ready-made looks the user can one-click apply, then fine-tune.
 */
export const PRESETS = [
    {
        id: 'zeroday',
        name: 'ZeroDay (default)',
        theme: DEFAULT_THEME,
    },
    {
        id: 'matrix',
        name: 'Matrix',
        theme: {
            mode: 'dark',
            colors: {
                bodyBg: '#000000', bodyColor: '#c8facc', surface: '#07120b', border: '#113b22',
                primary: '#22c55e', accentPink: '#39ff14', accentBlue: '#4ade80',
                sidebarBg: '#040b06', sidebarText: '#4ade80',
            },
        },
    },
    {
        id: 'amber',
        name: 'Amber CRT',
        theme: {
            mode: 'dark',
            colors: {
                bodyBg: '#140d00', bodyColor: '#ffd79a', surface: '#1d1402', border: '#4a3205',
                primary: '#f59e0b', accentPink: '#fbbf24', accentBlue: '#fcd34d',
                sidebarBg: '#0f0900', sidebarText: '#d9a441',
            },
        },
    },
    {
        id: 'ice',
        name: 'Ice',
        theme: {
            mode: 'dark',
            colors: {
                bodyBg: '#071019', bodyColor: '#e0f2fe', surface: '#0d1b28', border: '#1e3a52',
                primary: '#38bdf8', accentPink: '#f472b6', accentBlue: '#7dd3fc',
                sidebarBg: '#060e16', sidebarText: '#7dd3fc',
            },
        },
    },
    {
        id: 'paper',
        name: 'Paper (light)',
        theme: {
            mode: 'light',
            colors: {
                bodyBg: '#f8fafc', bodyColor: '#0f172a', surface: '#ffffff', border: '#d7dee8',
                primary: '#db2777', accentPink: '#db2777', accentBlue: '#0284c7',
                sidebarBg: '#eef2f7', sidebarText: '#475569',
            },
        },
    },
];

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

/**
 * Validates a #rrggbb string.
 *
 * @param {string} value
 * @return {boolean}
 */
export const isHex = (value) => typeof value === 'string' && HEX_RE.test(value.trim());

/**
 * Deep-clones a theme object so edits never mutate a preset/default.
 *
 * @param {Object} theme
 * @return {Object}
 */
export const cloneTheme = (theme) => ({
    mode: theme.mode,
    iconStyle: theme.iconStyle ?? DEFAULT_THEME.iconStyle,
    colors: { ...theme.colors },
    images: { ...DEFAULT_THEME.images, ...(theme.images ?? {}) },
});

/**
 * Merges a (possibly partial / untrusted) theme onto the default so the UI
 * always has every key, and drops any non-hex color back to its default.
 *
 * @param {Object} raw
 * @return {Object}
 */
export const normalizeTheme = (raw) => {
    const safe = cloneTheme(DEFAULT_THEME);
    if (!raw || typeof raw !== 'object') {
        return safe;
    }

    if (MODES.some((mode) => mode.id === raw.mode)) {
        safe.mode = raw.mode;
    }
    if (ICON_STYLES.some((s) => s.id === raw.iconStyle)) {
        safe.iconStyle = raw.iconStyle;
    }

    const colors = raw.colors ?? {};
    for (const token of TOKENS) {
        const value = colors[token.key];
        if (isHex(value)) {
            safe.colors[token.key] = value.trim().toLowerCase();
        }
    }

    const images = raw.images ?? {};
    if (typeof images.banner === 'string' || images.banner === null) {
        safe.images.banner = images.banner;
    }
    if (typeof images.background === 'string' || images.background === null) {
        safe.images.background = images.background;
    }
    if (typeof images.bgOpacity === 'number' && images.bgOpacity >= 0 && images.bgOpacity <= 1) {
        safe.images.bgOpacity = images.bgOpacity;
    }

    return safe;
};
