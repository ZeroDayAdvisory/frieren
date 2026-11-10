/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Tab, Tabs } from 'react-bootstrap';
import SessionsTab from '@module/feature/components/SessionsTab';
import LiveFeedTab from '@module/feature/components/LiveFeedTab';
import AnalyzeTab from '@module/feature/components/AnalyzeTab';

const CapturesPage = () => (
    <div className={'my-5'}>
        <h1 className={'mb-3 text-center'}>Captures</h1>
        <p className={'mb-4 text-center text-muted'}>
            Honeypot sessions, the live monitor-radio packet feed, and on-device BPF
            analysis of saved captures &mdash; all in one place.
        </p>

        <Tabs defaultActiveKey={'sessions'} className={'mb-4'} mountOnEnter unmountOnExit>
            <Tab eventKey={'sessions'} title={'Sessions'}>
                <div className={'pt-4'}>
                    <SessionsTab />
                </div>
            </Tab>
            <Tab eventKey={'live'} title={'Live Feed'}>
                <div className={'pt-4'}>
                    <LiveFeedTab />
                </div>
            </Tab>
            <Tab eventKey={'analyze'} title={'Analyze'}>
                <div className={'pt-4'}>
                    <AnalyzeTab />
                </div>
            </Tab>
        </Tabs>
    </div>
);

export default CapturesPage;
