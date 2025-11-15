class Genre {
  private _name: string;
  private _displayName: string;

  public get name(): string {
    return this._name;
  }

  public get displayName(): string {
    return this._displayName;
  }

  public set displayName(value: string) {
    this._displayName = value.replaceAll(/[^\w\s]/g, "");
    this._name = this._displayName.toLowerCase().trim();
  }
}

export { Genre };
