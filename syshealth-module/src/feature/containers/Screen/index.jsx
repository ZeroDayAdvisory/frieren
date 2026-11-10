/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Col, Row } from 'react-bootstrap';
import DiskCard from '@module/feature/components/DiskCard';
import VitalsCard from '@module/feature/components/VitalsCard';
import ProcessesCard from '@module/feature/components/ProcessesCard';
import useHealthQuery from '@module/feature/hooks/useHealthQuery';

const SysHealthPage = () => {
    const { data, isLoading, isRefetching, refetch } = useHealthQuery();
    const fetching = isLoading || isRefetching;

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>System Health</h1>
            <p className={'mb-4 text-center text-muted'}>
                Storage, temperature, memory, and daemon status for the pentest rig · refreshes every 10 s
            </p>

            <Row className={'g-4'}>
                <Col lg={6}>
                    <DiskCard
                        disks={data?.disks}
                        captureBytes={data?.captureBytes}
                        isFetching={fetching}
                        refetch={refetch}
                    />
                </Col>
                <Col lg={6}>
                    <div className={'d-flex flex-column gap-4'}>
                        <VitalsCard data={data} isFetching={fetching} refetch={refetch} />
                        <ProcessesCard data={data} isFetching={fetching} refetch={refetch} />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default SysHealthPage;
