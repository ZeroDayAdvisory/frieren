import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import ChannelHeatmapCard from '@module/feature/components/ChannelHeatmapCard';
import ChannelStatsCard from '@module/feature/components/ChannelStatsCard';
import useChannelDataQuery from '@module/feature/hooks/useChannelDataQuery';

const ChanMapPage = () => {
    const { data, isLoading, refetch, isRefetching } = useChannelDataQuery();
    const [selectedChannel, setSelectedChannel] = useState(null);

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>Channel Map</h1>
            <p className={'mb-4 text-center text-muted'}>
                Live 2.4 GHz and 5 GHz channel utilization — AP density, signal strength,
                and airtime busy percentage from the monitor radios.
            </p>

            <Row className={'g-4'}>
                <Col md={8}>
                    <ChannelHeatmapCard
                        bands={data?.bands}
                        scanId={data?.scanId}
                        isFetching={isLoading || isRefetching}
                        refetch={refetch}
                        onSelectChannel={setSelectedChannel}
                        selectedChannel={selectedChannel}
                    />
                </Col>
                <Col md={4}>
                    <ChannelStatsCard
                        bands={data?.bands}
                        selectedChannel={selectedChannel}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default ChanMapPage;
