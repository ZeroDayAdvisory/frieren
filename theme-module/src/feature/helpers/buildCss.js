/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *
 * JS mirror of ModuleOpenWrtHelper::writeCss — used to inject a live <style>
 * tag while the user drags color pickers, before anything is saved.
 */
export const buildCss = (theme) => {
    const c = theme.colors;
    const img = theme.images ?? {};
    const lines = [];

    lines.push(`:root{
  --bs-body-bg: ${c.bodyBg} !important;
  --bs-body-color: ${c.bodyColor} !important;
  --bs-card-bg: ${c.surface} !important;
  --bs-tertiary-bg: ${c.surface} !important;
  --bs-secondary-bg: ${c.surface} !important;
  --bs-border-color: ${c.border} !important;
  --bs-border-color-translucent: ${c.border} !important;
  --bs-primary: ${c.primary} !important;
  --bs-link-color: ${c.primary} !important;
  --bs-link-hover-color: ${c.primary} !important;
  --zd-pink: ${c.accentPink};
  --zd-blue: ${c.accentBlue};
}`);

    if (img.background) {
        const overlay = Math.max(0, Math.min(1, img.bgOpacity ?? 0.15));
        lines.push(`body{background-color: ${c.bodyBg} !important; color: ${c.bodyColor} !important; background-image: linear-gradient(rgba(0,0,0,${1 - overlay}),rgba(0,0,0,${1 - overlay})), url('${img.background}') !important; background-size: cover !important; background-attachment: fixed !important; background-position: center !important;}`);
        // .main-container is an opaque full-viewport wrapper that sits directly
        // on top of <body> — without this, the body background image is
        // completely hidden behind it no matter what's set above.
        lines.push(`.main-container{background-color: transparent !important;}`);
    } else {
        lines.push(`body{background-color: ${c.bodyBg} !important; color: ${c.bodyColor} !important;}`);
    }

    lines.push(`#sidebar{background-color: ${c.sidebarBg} !important; color: ${c.sidebarText} !important;}`);

    if (img.banner) {
        lines.push(`.navbar{background-image: url('${img.banner}') !important; background-size: cover !important; background-position: center !important;}`);
    }

    return lines.join('\n');
};

const LIVE_STYLE_ID = 'zd-theme-live-preview';

/**
 * Injects/updates a <style> tag so the current tab reflects the theme
 * immediately — during dragging and right after Save, without a reload.
 */
export const applyLivePreview = (theme) => {
    let tag = document.getElementById(LIVE_STYLE_ID);
    if (!tag) {
        tag = document.createElement('style');
        tag.id = LIVE_STYLE_ID;
        document.head.appendChild(tag);
    }
    tag.textContent = buildCss(theme);
};

export const clearLivePreview = () => {
    const tag = document.getElementById(LIVE_STYLE_ID);
    if (tag) tag.textContent = '';
};
