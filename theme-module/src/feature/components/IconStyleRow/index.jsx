/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { PINK } from '@module/colors';
import { ICON_STYLES } from '@module/feature/helpers/themeTokens';

const IconStyleRow = ({ value, onChange }) => (
    <div className={'d-flex flex-wrap gap-2'}>
        {ICON_STYLES.map((s) => (
            <button
                key={s.id}
                type={'button'}
                onClick={() => onChange(s.id)}
                className={'btn btn-sm'}
                style={{
                    border: `1px solid ${value === s.id ? PINK : 'rgba(255,255,255,0.2)'}`,
                    background: value === s.id ? 'rgba(255,45,120,0.1)' : 'transparent',
                    color: value === s.id ? PINK : 'inherit',
                    textAlign: 'left',
                }}
            >
                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{s.label}</div>
                <div className={'text-muted'} style={{ fontSize: '0.68rem' }}>{s.help}</div>
            </button>
        ))}
    </div>
);

export default IconStyleRow;
