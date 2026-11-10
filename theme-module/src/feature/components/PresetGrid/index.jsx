/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { PRESETS } from '@module/feature/helpers/themeTokens';

const Swatch = ({ color }) => (
    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: color, border: '1px solid rgba(255,255,255,0.2)' }} />
);

const PresetGrid = ({ onPick }) => (
    <div className={'d-flex flex-wrap gap-2'}>
        {PRESETS.map((p) => (
            <button
                key={p.id}
                type={'button'}
                onClick={() => onPick(p.theme)}
                className={'btn btn-sm'}
                style={{
                    background: p.theme.colors.surface,
                    border: `1px solid ${p.theme.colors.border}`,
                    color: p.theme.colors.bodyColor,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}
            >
                <Swatch color={p.theme.colors.bodyBg} />
                <Swatch color={p.theme.colors.accentPink} />
                <Swatch color={p.theme.colors.accentBlue} />
                <span style={{ fontSize: '0.78rem' }}>{p.name}</span>
            </button>
        ))}
    </div>
);

export default PresetGrid;
