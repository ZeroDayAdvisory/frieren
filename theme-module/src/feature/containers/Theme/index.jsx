/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Col, Row } from 'react-bootstrap';
import ThemeEditorCard from '@module/feature/components/ThemeEditorCard';

const ThemePage = () => (
    <div className={'my-5'}>
        <h1 className={'mb-3 text-center'}>Theme Customizer</h1>
        <p className={'mb-4 text-center text-muted'}>
            Recolor the entire Frieren panel — every module, every page.
        </p>
        <Row className={'g-4 justify-content-center'}>
            <Col lg={8}>
                <ThemeEditorCard />
            </Col>
        </Row>
    </div>
);

export default ThemePage;
