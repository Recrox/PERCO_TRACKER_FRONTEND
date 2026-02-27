export interface Position {
  x: number;
  y: number;
}

export interface Perceptor {
  id: string;
  position: Position;
  firstSeenDate: Date;
  lastSeenDate: Date;
  notes?: string;
}
