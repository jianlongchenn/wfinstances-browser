import { Button, Group, Loader, Select } from '@mantine/core';
import Cytoscape from 'cytoscape';
import { SetStateAction, useEffect, useState } from 'react';
import { layouts } from './layouts';
import CytoscapeComponent from 'react-cytoscapejs';
// @ts-ignore
import DAGRE from 'cytoscape-dagre';

Cytoscape.use(DAGRE);

export function Visualizer({ id }: { id: string }) {
  const cytoscapeStylesheet = [
    {
      selector: "node",
      style: {
        "background-color": "data(bg)",
        width: "label",
        height: "label",
        padding: "6px",
        shape: "round-rectangle"
      }
    },
    {
      selector: "node[type = 'file']",
      style: {
        "background-color": "data(bg)",
        width: "label",
        height: "label",
        padding: "6px",
        shape: "round-rectangle"
      }
    },
    {
      selector: "node[label]",
      style: {
        label: "data(label)",
        "font-size": "12",
        color: "white",
        "text-halign": "center",
        "text-valign": "center"
      }
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        width: 1.5
      }
    },
    {
      selector: "edge[label]",
      style: {
        label: "data(label)",
        "font-size": "12",
        "text-background-color": "white",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
        "text-border-color": "black",
        "text-border-style": "solid",
        "text-border-width": 0.5,
        "text-border-opacity": 1
      }
    }
  ] as cytoscape.Stylesheet[];

  const [elements, setElements] = useState<any[]>([]);
  const [layout, setLayout] = useState(layouts.dagre)
  const [isLoading, setIsLoading] = useState(true);

  function getRandomColorHex(): string {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    return "#" + red.toString(16) + green.toString(16) + blue.toString(16);
  }


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:8081/wf-instances/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const res = await response.json();
        const tasks = res.result.workflow.tasks;
        const graphElements: SetStateAction<any[]> = [];
        const existingNode = new Set<string>(); //Set checking if a file has been added yet.
        const colorMap = new Map<string, string>(); //Mapping of colors to filenames so all files have the same name.
        var uniqueIdentify = 0; //Value to be added to the ids in order to create unique id names.
        tasks.forEach((task: any) => {
          var taskId = task.id;
          if(colorMap.has(task.name)) {
            //If the ColorMap already has the task name, create a unique ID for the node and use the same color as the previous task.
            taskId = task.id + uniqueIdentify;
            uniqueIdentify++;
            graphElements.push({ data: { id: taskId, label: task.name, bg: colorMap.get(task.name) } });
          } else {
            //If the ColorMap does not have the task name yet use the original node id and map a color to that unique id.
            const setColor = getRandomColorHex();
            colorMap.set(task.name, setColor);
            graphElements.push({ data: { id: task.id, label: task.name, bg: setColor } });
          }
          
          task.files.forEach((file: any) => {
            if (!existingNode.has(file.name)) {
              existingNode.add(file.name);
              //Begun Implementing File Coloration
              graphElements.push({ data: { id: file.name, label: file.name, type: 'file', bg: '#A9A9A9' } });
            }
            if (file.link === "input") {
              graphElements.push({ data: { source: file.name, target: taskId } });
            } else {
              graphElements.push({ data: { source: taskId, target: file.name } });
            }
          });
        });
        setElements(graphElements);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);


  return (
    <>
      {isLoading ? (
        <Loader color="blue" />
      ) : (
        <CytoscapeComponent
          key={elements.length}
          elements={elements}
          layout={layout}
          style={{ minWidth: '400px', maxWidth: '1300px', height: '700px' }}
          stylesheet={cytoscapeStylesheet}
        />
      )}
      <Group justify="center">
        <Button variant="default">Toggle Files Only</Button>
      </Group>
    </>
  );
}
