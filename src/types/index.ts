export interface Scene {
  date: string;
  filename: string;
  url: string;
  bounds: [number, number, number, number]; // [west, south, east, north]
}

export interface Manifest {
  scenes: Scene[];
}
