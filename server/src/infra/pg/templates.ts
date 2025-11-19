export function templateOfList(params: { n: number }): string {
  let template = "(";

  for (let i = 1; i <= params.n; i++) {
    if (1 < i) template += ",";
    template += `$${i}`;
  }

  template += ")";
  return template;
}

export function recordsTemplate(params: {
  numberOfRecords: number;
  sizeOfRecord: number;
  casting?: string[];
}): string {
  if (
    params.casting &&
    params.casting.length != params.sizeOfRecord
  ) throw new Error(`Casting array must be of length ${params.sizeOfRecord}`);

  let template = "";

  for (let i = 0; i < params.numberOfRecords; i++) {
    if (i > 0) template += ",";
    template += "(";

    for (let j = 0; j < params.sizeOfRecord; j++) {
      if (j > 0) template += ",";
      template += `$${i * params.sizeOfRecord + j + 1}`;
      if (params.casting && params.casting[j]) template += "::" + params.casting[j];
    }

    template += ")";
  }

  return template;
}
