import {Button, Group, Modal, Table, Title, NumberInput, ActionIcon, Slider, Text, Tooltip, Loader} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import {simulate} from '../../workflow_simulator/simulator';
import { SimulationGraph } from '~/components/SimulationGraph';
import {useState} from "react";

export function SimulateModal({
    id,
    opened,
    onClose
}: { 
    id: string,
    opened: boolean,
    onClose: () => void
}) {
    const [elements, setElements] = useState([
        { cluster: 1, bw: 400, latency: 10, computeNode: 16, core: 1, speed: 1},
        { cluster: 2, bw: 100, latency: 10, computeNode: 64, core: 1, speed: 2},
        { cluster: 3, bw: 300, latency: 10, computeNode: 32, core: 1, speed: 3},
    ])
    interface TaskData {
        task_name: string;
        cluster_index: number;
        scheduled_time: number;
        completion_time: number;
      }
    const [readBandwidth, setReadBandwidth] = useState(100);
    const [writeBandwidth, setWriteBandwidth] = useState(100);
    const [newCluster, increaseCluster] = useState(elements.length+1);
    const [showGraph, setShowGraph] = useState(false); // New state to control graph visibility
    const [graphData, setGraphData] = useState<TaskData[] | null>(null);
    const [loading, setLoading] = useState(false);

    const addRow = () => {
        increaseCluster(newCluster + 1);// Increment cluster number
        const newElement = { cluster: newCluster, bw: 100, latency: 10, computeNode: 32, core: 1, speed: 1 };
        setElements([...elements, newElement]); // Add new element to state
    };
    const deleteRow = (index) => {
        const updatedElements = elements.filter((_, i) => i !== index); // Remove the row at the given index
        setElements(updatedElements);
    };

    // Function to handle input change in the table
    const updateElement = (index, field, value) => {
        const updatedElements = elements.map((element, i) =>
            (i === index ? { ...element, [field]: value } : element)
        );
        setElements(updatedElements);
    };
    // New getData function
    const getData = () => {
        const clusterData = {
            readBandwidth,
            writeBandwidth,
            clusters: {},
        };
        elements.forEach((element, index) => {
            const values = {
                "bw": element.bw,
                "latency": element.latency,
                "computeNodes": element.computeNode,
                "cores": element.core,
                "speed": element.speed
            };
            clusterData.clusters[(index + 1).toString()] = values; // Index is 0-based, so +1
        });
        console.log(clusterData);
        return clusterData;
    };

    // Combined function to run simulation and get data
    const handleRunSimulation = async () => {
        setLoading(true); // Show loader
        const data = getData();
        // Pass the simulation data to the simulate function and wait for results
        const results = await simulate(id, data);
        setGraphData(results.result.Runtime);  // Set the data returned from simulation
        setShowGraph(true);  // Display the graph after simulation
        setLoading(false);
    };
    // Generate table rows with input fields
    const rows = elements.map((element, index) => (
        <tr key={element.cluster}>
            <td style={{ width: 'auto', padding: '2px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ActionIcon color="red" onClick={() => deleteRow(index)}>
                        <Tooltip label="Delete Cluster"><IconTrash size={16} /></Tooltip>
                    </ActionIcon>
                </div>
            </td>
            <td key='bw'>
                <NumberInput
                    value={element['bw']}
                    onChange={(value) => updateElement(index, 'bw', value)}
                    defaultValue='bw'
                    size="xs"
                    suffix="kBps"
                    min={50}
                    max={1000}
                />
                <Slider
                    value={element['bw']}
                    onChange={(value) => updateElement(index, 'bw', value)}
                    defaultValue='bw'
                    min={50}
                    max={1000}
                    step={50}
                    label={(value) => `${value} kBps`} />
            </td>
            <td key='latency'>
                <NumberInput
                    value={element['latency']}
                    onChange={(value) => updateElement(index, 'latency', value)}
                    defaultValue='latency'
                    size="xs"
                    suffix="ms"
                    min={1}
                    max={100}
                />
                <Slider value={element['latency']}
                    onChange={(value) => updateElement(index, 'latency', value)}
                    defaultValue='latency'
                    min={1}
                    max={100}
                    step={1}
                    label={(value) => `${value} ms`} />
            </td>
            <td key='computeNode'>
                <NumberInput
                    value={element['computeNode']}
                    onChange={(value) => updateElement(index, 'computeNode', value)}
                    defaultValue='computeNode'
                    size="xs"
                    min={4}
                    max={256}
                />
                <Slider
                    value={element['computeNode']}
                    onChange={(value) => updateElement(index, 'computeNode', value)}
                    defaultValue='computeNode'
                    min={4}
                    max={256}
                    step={2} />
            </td>
            <td key='core'>
                <NumberInput
                    value={element['core']}
                    onChange={(value) => updateElement(index, 'core', value)}
                    defaultValue='core'
                    size="xs"
                    min={1}
                    max={10}
                />
                <Slider
                    value={element['core']}
                    onChange={(value) => updateElement(index, 'core', value)}
                    defaultValue='core'
                    min={1}
                    max={10}
                    step={1} />
            </td>
            <td key='speed'>
                <NumberInput
                    value={element['speed']}
                    onChange={(value) => updateElement(index, 'speed', value)}
                    defaultValue='speed'
                    size="xs"
                    suffix="Gflop/sec"
                    min={1}
                    max={10}
                />
                <Slider
                    value={element['speed']}
                    onChange={(value) => updateElement(index, 'speed', value)}
                    defaultValue='speed'
                    min={1}
                    max={10}
                    step={1}
                    label={(value) => `${value} Gflop/sec`} />
            </td>
        </tr>
    ));

    return (
        <Modal title="WfInstance Simulation" opened={opened} onClose={onClose} size='100%'>
            <i>{id}</i>
            <Group justify="center">
                <Title order={4}>Input Compute Platform XML Specifications</Title>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Cluster</Table.Th>
                            <Table.Th>Link Bandwidth</Table.Th>
                            <Table.Th>Link Latency</Table.Th>
                            <Table.Th>Compute Nodes</Table.Th>
                            <Table.Th>Cores per Compute Nodes</Table.Th>
                            <Table.Th>Core Speed</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
                <Button variant="default" onClick={addRow}>Add Cluster</Button>
            </Group>
            <Group justify="flex-start" pt={15}>
                <div>
                    <Table justify="left">
                        <Table.Tbody>
                            <tr>
                                <td width="auto" valign="top">
                                    <Text px={10}>Read Bandwidth of the Disk on the Controller Host:  </Text>
                                </td>
                                <td width="auto">
                                    <NumberInput
                                        defaultValue={100}
                                        min={50}
                                        max={1000}
                                        size="xs"
                                        suffix="MBps"
                                        value={readBandwidth}
                                        onChange={setReadBandwidth}  />
                                    <Slider
                                        value={readBandwidth}
                                        onChange={setReadBandwidth}
                                        defaultValue={100}
                                        min={50}
                                        max={1000}
                                        step={50}
                                        label={(value) => `${value} MBps`} />
                                </td>
                            </tr>
                            <tr></tr>
                            <tr>
                                <td width="auto" valign="top">
                                    <Text px={10}>Write Bandwidth of the Disk on the Controller Host:  </Text>
                                </td>
                                <td width="auto">
                                    <NumberInput
                                        defaultValue={100}
                                        min={50}
                                        max={1000}
                                        size="xs"
                                        suffix="MBps"
                                        value={writeBandwidth}
                                        onChange={setWriteBandwidth}  />
                                    <Slider
                                        value={writeBandwidth}
                                        onChange={setWriteBandwidth}
                                        defaultValue={100}
                                        min={50}
                                        max={1000}
                                        step={50}
                                        label={(value) => `${value} MBps`} />
                                </td>
                                <td></td>
                            </tr>
                        </Table.Tbody>
                    </Table>
                </div>
            </Group>
            <Group justify="center" pt={15}>
                <Button variant="success" onClick={handleRunSimulation}>Run Simulation</Button>
            </Group>
            <Group justify="center" align="center" style={{ width: '100%', marginTop: '20px' }}>
                {loading ? (
                    <Loader color="gray" /> // Show loader while loading
                ) : (
                    showGraph && graphData && <SimulationGraph runtimeData={graphData} id={id} />
                )}
            </Group>
        </Modal>
    );
}
