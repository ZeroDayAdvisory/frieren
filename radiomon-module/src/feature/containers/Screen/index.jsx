/*
 * Project: Frieren Framework
 * Module: System Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Col, Row } from 'react-bootstrap';
import AdapterCard from '@module/feature/components/AdapterCard';
import ApRadioCard from '@module/feature/components/ApRadioCard';
import ScanStatusCard from '@module/feature/components/ScanStatusCard';
import MitmToggleCard from '@module/feature/components/MitmToggleCard';
import DiskCard from '@module/feature/components/DiskCard';
import VitalsCard from '@module/feature/components/VitalsCard';
import ProcessesCard from '@module/feature/components/ProcessesCard';
import useRadioStatusQuery from '@module/feature/hooks/useRadioStatusQuery';
import useAdaptersWithFps from '@module/feature/hooks/useAdaptersWithFps';
import useApRadiosWithRate from '@module/feature/hooks/useApRadiosWithRate';
import useHealthQuery from '@module/feature/hooks/useHealthQuery';

const SystemMonitorPage = () => {
    const status = useRadioStatusQuery();
    const adapters = useAdaptersWithFps(status.data?.adapters);
    const apRadios = useApRadiosWithRate(status.data?.ap_radios);

    const health = useHealthQuery();
    const healthFetching = health.isLoading || health.isRefetching;

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>System Monitor</h1>
            <p className={'mb-4 text-center text-muted'}>
                Live radios, honeypot intercept, and rig health &mdash; everything that matters
                while a scan or capture is running, in one place.
            </p>

            <Row className={'g-4'}>
                <Col lg={12}>
                    <MitmToggleCard />
                </Col>
                <Col lg={12}>
                    <VitalsCard data={health.data} isFetching={healthFetching} refetch={health.refetch} />
                </Col>
                <Col md={6}>
                    <DiskCard
                        disks={health.data?.disks}
                        captureBytes={health.data?.captureBytes}
                        isFetching={healthFetching}
                        refetch={health.refetch}
                    />
                </Col>
                <Col md={6}>
                    <ProcessesCard data={health.data} isFetching={healthFetching} refetch={health.refetch} />
                </Col>
                <Col lg={12}>
                    <ScanStatusCard
                        status={status.data}
                        isFetching={status.isLoading || status.isRefetching}
                        refetch={status.refetch}
                    />
                </Col>
                {adapters.map((adapter) => (
                    <Col md={6} key={adapter.name}>
                        <AdapterCard adapter={adapter} />
                    </Col>
                ))}
                {apRadios.map((radio) => (
                    <Col md={6} key={radio.iface}>
                        <ApRadioCard radio={radio} />
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default SystemMonitorPage;
