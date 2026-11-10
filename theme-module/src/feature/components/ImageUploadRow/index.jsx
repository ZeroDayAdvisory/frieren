/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useRef, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useUploadImageMutation from '@module/feature/hooks/useUploadImageMutation';

const MAX_BYTES = 3 * 1024 * 1024;

const fileToDataUri = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const ImageUploadRow = ({ label, help, value, onChange }) => {
    const inputRef = useRef(null);
    const mutation = useUploadImageMutation();
    const [busy, setBusy] = useState(false);

    const kind = label.toLowerCase().includes('banner') ? 'banner' : 'background';

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_BYTES) {
            toast.error('Image too large — max 3MB.');
            return;
        }
        setBusy(true);
        try {
            const dataUri = await fileToDataUri(file);
            const res = await mutation.mutateAsync({ kind, dataUri });
            onChange(res?.url ?? null);
            toast.success(`${label} uploaded.`);
        } catch {
            toast.error(`Failed to upload ${label.toLowerCase()}.`);
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className={'d-flex align-items-center gap-3 py-2'}>
            {value ? (
                <img src={value} alt={label} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
            ) : (
                <div style={{ width: 60, height: 40, borderRadius: 6, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
                <div className={'fw-semibold'} style={{ fontSize: '0.85rem' }}>{label}</div>
                <div className={'text-muted'} style={{ fontSize: '0.72rem' }}>{help}</div>
            </div>
            <input ref={inputRef} type={'file'} accept={'image/*'} hidden onChange={handleFile} />
            <Button
                size={'sm'}
                variant={'outline-secondary'}
                onClick={() => inputRef.current?.click()}
                disabled={busy}
            >
                {busy ? <Spinner animation={'border'} size={'sm'} /> : (value ? 'Replace' : 'Upload')}
            </Button>
            {value && (
                <Button size={'sm'} variant={'outline-danger'} onClick={() => onChange(null)} disabled={busy}>
                    Remove
                </Button>
            )}
        </div>
    );
};

export default ImageUploadRow;
