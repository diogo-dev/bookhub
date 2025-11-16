interface WorkDTO {
  readonly ID: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly authors: string[];
  readonly editions: string[];
  readonly createdAt: number;
}

export type { WorkDTO };
