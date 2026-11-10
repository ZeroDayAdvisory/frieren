// BPF filter presets (tcpdump syntax — not Wireshark display filters).
export const FILTER_PRESETS = [
    { label: 'All traffic', filter: '' },
    { label: 'HTTP', filter: 'tcp port 80' },
    { label: 'TLS / HTTPS', filter: 'tcp port 443' },
    { label: 'DNS', filter: 'udp port 53' },
    { label: 'DHCP', filter: 'udp port 67 or udp port 68' },
    { label: 'ARP', filter: 'arp' },
    { label: 'ICMP', filter: 'icmp' },
    { label: 'TCP SYN', filter: 'tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack == 0' },
];

export const MODES = [
    { value: 'summary', label: 'Summary' },
    { value: 'detail', label: 'Verbose' },
    { value: 'ascii', label: 'ASCII' },
    { value: 'hex', label: 'Hex + ASCII' },
];
