/*
 * Project: Frieren Framework
 * Module: Tools (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Tab, Tabs } from 'react-bootstrap';
import BettercapTab from '@module/feature/components/BettercapTab';
import KismetTab from '@module/feature/components/KismetTab';
import Mdk4Tab from '@module/feature/components/Mdk4Tab';
import WiresharkTab from '@module/feature/components/WiresharkTab';

const ToolsPage = () => (
    <div className={'my-5'}>
        <h1 className={'mb-3 text-center'}>Tools</h1>
        <p className={'mb-4 text-center text-muted'}>
            Third-party tool wrappers &mdash; each panel only manages the process
            (interface + start/stop); use each tool&apos;s own native UI for the real work.
        </p>

        <Tabs defaultActiveKey={'bettercap'} className={'mb-4'} mountOnEnter unmountOnExit>
            <Tab eventKey={'bettercap'} title={'Bettercap'}>
                <div className={'pt-4'}>
                    <BettercapTab />
                </div>
            </Tab>
            <Tab eventKey={'kismet'} title={'Kismet'}>
                <div className={'pt-4'}>
                    <KismetTab />
                </div>
            </Tab>
            <Tab eventKey={'mdk4'} title={'MDK4'}>
                <div className={'pt-4'}>
                    <Mdk4Tab />
                </div>
            </Tab>
            <Tab eventKey={'wireshark'} title={'Wireshark'}>
                <div className={'pt-4'}>
                    <WiresharkTab />
                </div>
            </Tab>
        </Tabs>
    </div>
);

export default ToolsPage;
