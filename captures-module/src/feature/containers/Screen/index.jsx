/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Col, Row } from 'react-bootstrap';
import LiveClientsCard from '@module/feature/components/LiveClientsCard';
import SessionsCard from '@module/feature/components/SessionsCard';
import useLiveClientsQuery from '@module/feature/hooks/useLiveClientsQuery';
import useSessionsQuery from '@module/feature/hooks/useSessionsQuery';

const CapturesPage = () => {
    const live = useLiveClientsQuery();
    const sessions = useSessionsQuery();

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>Captures</h1>
            <p className={'mb-4 text-center text-muted'}>
                Live honeypot clients and the per-device packet captures the MITM watcher
                writes to the USB drive.
            </p>

            <Row className={'g-4'}>
                <Col lg={12}>
                    <LiveClientsCard
                        data={live.data}
                        isFetching={live.isLoading || live.isRefetching}
                        refetch={live.refetch}
                    />
                </Col>
                <Col lg={12}>
                    <SessionsCard
                        data={sessions.data}
                        isFetching={sessions.isLoading || sessions.isRefetching}
                        refetch={sessions.refetch}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default CapturesPage;
