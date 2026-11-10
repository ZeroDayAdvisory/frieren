/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Form } from 'react-bootstrap';
import { isHex } from '@module/feature/helpers/themeTokens';

const ColorRow = ({ token, value, onChange }) => {
    const valid = isHex(value);

    return (
        <div className={'d-flex align-items-center gap-3 py-2'}>
            <input
                type={'color'}
                value={valid ? value : '#000000'}
                onChange={(e) => onChange(token.key, e.target.value)}
                style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, flex: '0 0 170px' }}>
                <div className={'fw-semibold'} style={{ fontSize: '0.85rem' }}>{token.label}</div>
                <div className={'text-muted'} style={{ fontSize: '0.72rem' }}>{token.help}</div>
            </div>
            <Form.Control
                value={value}
                onChange={(e) => onChange(token.key, e.target.value)}
                isInvalid={!valid}
                size={'sm'}
                style={{ maxWidth: 110, fontFamily: 'monospace' }}
            />
        </div>
    );
};

export default ColorRow;
