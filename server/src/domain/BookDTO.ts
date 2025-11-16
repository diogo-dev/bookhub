interface BookDTO {
  readonly ISBN: string;
  readonly workID: string | null;
  readonly category: string | null;
  readonly genres: string[];
  readonly title: string;
  readonly subtitle: string | null;
  readonly description: string | null;
  readonly cover: string | null;
  readonly authors: string[];
  readonly publisher: string | null;
  readonly edition: string | null;
  readonly language: string | null;
  readonly numberOfPages: number;
  readonly numberOfVisits: number;
  readonly publishedAt: number | null;
  readonly createdAt: number;
  readonly items: string[];
}

export type { BookDTO };
