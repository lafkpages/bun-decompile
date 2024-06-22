declare module "*.txt" {
  const contents: string;
  export default contents;
}

declare module "*.bin" {
  const path: string;
  export default path;
}

declare module "*.png" {
  const path: string;
  export default path;
}
