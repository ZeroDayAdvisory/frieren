/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import { PINK } from '@module/colors';
import { TOKENS, TOKEN_GROUPS, cloneTheme, normalizeTheme } from '@module/feature/helpers/themeTokens';
import { applyLivePreview, clearLivePreview } from '@module/feature/helpers/buildCss';
import ColorRow from '@module/feature/components/ColorRow';
import PresetGrid from '@module/feature/components/PresetGrid';
import IconStyleRow from '@module/feature/components/IconStyleRow';
import ImageUploadRow from '@module/feature/components/ImageUploadRow';
import useThemeQuery from '@module/feature/hooks/useThemeQuery';
import useSetThemeMutation from '@module/feature/hooks/useSetThemeMutation';
import useResetThemeMutation from '@module/feature/hooks/useResetThemeMutation';

const ThemeEditorCard = () => {
    const { data, isLoading, refetch, isRefetching } = useThemeQuery();
    const setMutation = useSetThemeMutation();
    const resetMutation = useResetThemeMutation();

    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (data?.theme && draft === null) {
            setDraft(cloneTheme(normalizeTheme(data.theme)));
        }
    }, [data, draft]);

    // Live preview while editing; cleared on unmount so leaving the page
    // doesn't leave an unsaved preview active.
    useEffect(() => {
        if (draft) applyLivePreview(draft);
        return () => clearLivePreview();
    }, [draft]);

    const handleColorChange = (key, value) => {
        setDraft((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    };

    const handleIconStyle = (iconStyle) => {
        setDraft((prev) => ({ ...prev, iconStyle }));
    };

    const handleImageChange = (key, value) => {
        setDraft((prev) => ({ ...prev, images: { ...prev.images, [key]: value } }));
    };

    const handlePreset = (theme) => {
        setDraft((prev) => cloneTheme({ ...theme, images: prev?.images }));
    };

    const handleSave = async () => {
        try {
            await setMutation.mutateAsync(draft);
            toast.success('Theme saved — applied across the whole panel.');
        } catch {
            toast.error('Failed to save theme.');
        }
    };

    const handleReset = async () => {
        try {
            const res = await resetMutation.mutateAsync();
            setDraft(cloneTheme(normalizeTheme(res?.theme)));
            toast.success('Theme reset to default.');
        } catch {
            toast.error('Failed to reset theme.');
        }
    };

    if (isLoading || !draft) {
        return (
            <PanelCard title={'Theme Editor'} icon={'droplet'} isFetching={true}>
                <Spinner animation={'border'} size={'sm'} />
            </PanelCard>
        );
    }

    return (
        <PanelCard
            title={'Theme Editor'}
            icon={'droplet'}
            refetch={refetch}
            isFetching={isRefetching}
        >
            <div className={'mb-4'}>
                <div className={'small text-muted mb-2'}>Presets</div>
                <PresetGrid onPick={handlePreset} />
            </div>

            {TOKEN_GROUPS.map((group) => (
                <div key={group.id} className={'mb-3'}>
                    <div className={'small fw-semibold text-uppercase mb-1'} style={{ letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
                        {group.label}
                    </div>
                    {TOKENS.filter((t) => t.group === group.id).map((token) => (
                        <ColorRow
                            key={token.key}
                            token={token}
                            value={draft.colors[token.key]}
                            onChange={handleColorChange}
                        />
                    ))}
                </div>
            ))}

            <div className={'mb-3'}>
                <div className={'small fw-semibold text-uppercase mb-2'} style={{ letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
                    Module Icons
                </div>
                <IconStyleRow value={draft.iconStyle} onChange={handleIconStyle} />
                <div className={'small text-muted mt-1'}>
                    Applies on Save (sidebar icons aren&apos;t live-previewed).
                </div>
            </div>

            <div className={'mb-3'}>
                <div className={'small fw-semibold text-uppercase mb-1'} style={{ letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
                    Images
                </div>
                <ImageUploadRow
                    label={'Top banner'}
                    help={'Replaces the top nav bar background.'}
                    value={draft.images.banner}
                    onChange={(url) => handleImageChange('banner', url)}
                />
                <ImageUploadRow
                    label={'Page background'}
                    help={'Full-page background image behind every panel.'}
                    value={draft.images.background}
                    onChange={(url) => handleImageChange('background', url)}
                />
                {draft.images.background && (
                    <div className={'d-flex align-items-center gap-3 py-2'}>
                        <div style={{ minWidth: 0, flex: '0 0 170px' }}>
                            <div className={'fw-semibold'} style={{ fontSize: '0.85rem' }}>Overlay darkness</div>
                            <div className={'text-muted'} style={{ fontSize: '0.72rem' }}>Keeps text readable over the image.</div>
                        </div>
                        <input
                            type={'range'}
                            min={0}
                            max={1}
                            step={0.05}
                            value={draft.images.bgOpacity}
                            onChange={(e) => handleImageChange('bgOpacity', parseFloat(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span className={'small text-muted'} style={{ width: 40 }}>{Math.round(draft.images.bgOpacity * 100)}%</span>
                    </div>
                )}
            </div>

            <div className={'d-flex gap-2 mt-4'}>
                <Button
                    onClick={handleSave}
                    disabled={setMutation.isPending}
                    style={{ background: PINK, border: 'none' }}
                >
                    {setMutation.isPending ? <Spinner animation={'border'} size={'sm'} /> : 'Save Theme'}
                </Button>
                <Button
                    variant={'outline-secondary'}
                    onClick={handleReset}
                    disabled={resetMutation.isPending}
                >
                    Reset to Default
                </Button>
            </div>
            <div className={'small text-muted mt-2'}>
                Colors preview live as you edit. Click Save to persist and apply for everyone.
            </div>
        </PanelCard>
    );
};

export default ThemeEditorCard;
