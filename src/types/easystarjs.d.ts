// easystarjs has no bundled types. The package exports a namespace object
// whose `js` property is the actual class (see node_modules/easystarjs/src/easystar.js).
declare module 'easystarjs' {
  interface EasyStarInstance {
    setGrid(grid: number[][]): void;
    setAcceptableTiles(tiles: number[]): void;
    enableDiagonals(): void;
    disableCornerCutting(): void;
    findPath(
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      cb: (path: Array<{ x: number; y: number }> | null) => void,
    ): void;
    calculate(): void;
  }
  const EasyStar: {
    js: new () => EasyStarInstance;
  };
  export = EasyStar;
}
