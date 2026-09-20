import type { StageScene } from '../components/ProjectStage.astro';
import aerial from '../assets/images/projects/venserpolder/aerial.jpg';
import courtyard from '../assets/images/projects/venserpolder/courtyard.jpg';
import focusMap from '../assets/images/projects/venserpolder/focus-streets-map.jpg';
import gardenWinter from '../assets/images/projects/venserpolder/garden-winter.jpg';
import ideationBoard from '../assets/images/projects/venserpolder/ideation-board.jpg';
import playground from '../assets/images/projects/venserpolder/playground.jpg';
import prototypeAerial from '../assets/images/projects/venserpolder/prototype-aerial.jpg';
import prototypePlan from '../assets/images/projects/venserpolder/prototype-plan.jpg';
import stressMap from '../assets/images/projects/venserpolder/stress-map.jpg';
import street1 from '../assets/images/projects/venserpolder/street-1.jpg';
import street2 from '../assets/images/projects/venserpolder/street-2.jpg';
import waterMap from '../assets/images/projects/venserpolder/water-structure-map.jpg';

// Captions are the images' own alt text; depth 0 sits farthest back, 1 nearest the reader.
export const venserpolderStage: StageScene[] = [
  {
    id: 'neighbourhood',
    title: 'The neighbourhood',
    caption: 'Aerial view of Venserpolder, a grid of mid-rise housing blocks with inner courtyards, bordered by railway lines.',
    layers: [
      { src: aerial, alt: 'Aerial view of Venserpolder', depth: 0.2, x: 4, y: 10, w: 56 },
      { src: waterMap, alt: 'Map of existing waterways and proposed canals', depth: 0.8, x: 46, y: 34, w: 34 },
    ],
  },
  {
    id: 'streets',
    title: 'Streets',
    caption: 'Wide brick streets lined with parked cars and four-storey housing blocks, few trees.',
    layers: [
      { src: street1, alt: 'Wide brick street with parked cars', depth: 0.3, x: 6, y: 12, w: 44 },
      { src: street2, alt: 'Street with brick paving and bicycle racks', depth: 0.9, x: 40, y: 40, w: 40 },
    ],
  },
  {
    id: 'courtyards',
    title: 'Courtyards',
    caption: 'Paved inner courtyards between the blocks: a sandpit, a metal slide, and one community allotment in winter.',
    layers: [
      { src: courtyard, alt: 'Paved inner courtyard with a small sandpit', depth: 0.2, x: 4, y: 8, w: 40 },
      { src: playground, alt: 'Metal slide on a paved courtyard', depth: 0.6, x: 34, y: 30, w: 30 },
      { src: gardenWinter, alt: 'Community allotment plot in winter', depth: 1, x: 56, y: 14, w: 30 },
    ],
  },
  {
    id: 'stress',
    title: 'Where it hurts',
    caption: 'Locations of summer heat stress and of water pooling after heavy rain, with the two focus streets circled.',
    layers: [
      { src: stressMap, alt: 'Map of heat stress and water pooling', depth: 0.2, x: 4, y: 8, w: 50 },
      { src: focusMap, alt: 'Climate stress map with the focus streets circled', depth: 0.9, x: 42, y: 32, w: 44 },
    ],
  },
  {
    id: 'ideas',
    title: 'Ideation',
    caption: 'Digital whiteboard with clustered sticky notes of ideas, merged into a shortlist.',
    layers: [{ src: ideationBoard, alt: 'Digital whiteboard with clustered sticky notes', depth: 0.5, x: 8, y: 22, w: 76 }],
  },
  {
    id: 'prototype',
    title: 'The prototype',
    caption: 'A street converted into a canal with green banks, gardens and gathering spaces, drawn over the existing blocks.',
    layers: [
      { src: prototypeAerial, alt: 'Aerial photo with a rendered canal and green corridor', depth: 0.2, x: 4, y: 12, w: 54 },
      { src: prototypePlan, alt: 'Top-down plan render of the street as a canal', depth: 1, x: 62, y: 4, w: 20 },
    ],
  },
];
