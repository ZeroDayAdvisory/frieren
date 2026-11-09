/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import PanelStack from '@src/components/PanelCard/PanelStack';
import AddMacCard from '@module/feature/components/AddMacCard';
import AllowListCard from '@module/feature/components/AllowListCard';
import ReconResultsCard from '@module/feature/components/ReconResultsCard';

/**
 * Renders the MAC Allow-List page: add new entries and manage existing ones
 * on Aura's shared filter list, plus a vendor-enriched view of the latest
 * recon scan.
 *
 * @return {ReactElement} The rendered page.
 */
const MacFilterPage = () => (
    <div className={'my-5'}>
        <h1 className={'mb-3 text-center'}>MAC Allow-List</h1>
        <p className={'mb-4 text-center text-muted'}>
            Manage the shared allow-list used by Aura&apos;s deauth gate and the honeypot MITM automation.
        </p>

        <PanelStack>
            <AddMacCard />
            <AllowListCard />
            <ReconResultsCard />
        </PanelStack>
    </div>
);

export default MacFilterPage;
