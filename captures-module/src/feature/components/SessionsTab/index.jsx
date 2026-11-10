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

const SessionsTab = () => {
    const live = useLiveClientsQuery();
    const sessions = useSessionsQuery();

    return (
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
    );
};

export default SessionsTab;
