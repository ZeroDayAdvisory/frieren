/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { PINK } from '@module/colors';
import { ICON_STYLES, isHex } from '@module/feature/helpers/themeTokens';

const IconStyleRow = ({ value, color, onChange, onColorChange }) => (
    <div>
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
        {value === 'colored' && (
            <div className={'d-flex align-items-center gap-2 mt-2'}>
                <input
                    type={'color'}
                    value={isHex(color) ? color : PINK}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ width: 36, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                />
                <span className={'small text-muted'}>Chip color for every module icon</span>
            </div>
        )}
    </div>
);

export default IconStyleRow;
