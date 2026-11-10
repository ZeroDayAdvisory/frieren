/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import ChannelHeatmapCardFull from '@module/feature/components/ChannelHeatmapCard';
import ChannelStatsCard from '@module/feature/components/ChannelStatsCard';
import DeauthStatsCard from '@module/feature/components/DeauthStatsCard';
import useChannelDataQuery from '@module/feature/hooks/useChannelDataQuery';

const ChanMapPage = () => {
    const { data, isLoading, refetch, isRefetching } = useChannelDataQuery();
    const [selectedChannel, setSelectedChannel] = useState(null);

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>Channel Map</h1>
            <p className={'mb-4 text-center text-muted'}>
                2.4 GHz and 5 GHz channel utilization — AP density, signal strength, airtime busy%,
                and live management frame activity from the monitor radios.
            </p>

            <Row className={'g-4'}>
                <Col lg={8}>
                    <ChannelHeatmapCardFull
                        bands={data?.bands}
                        scanId={data?.scanId}
                        isFetching={isLoading || isRefetching}
                        refetch={refetch}
                        onSelectChannel={setSelectedChannel}
                        selectedChannel={selectedChannel}
                    />
                </Col>
                <Col lg={4}>
                    <div className={'d-flex flex-column gap-4'}>
                        <ChannelStatsCard
                            bands={data?.bands}
                            selectedChannel={selectedChannel}
                        />
                        <DeauthStatsCard />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ChanMapPage;
