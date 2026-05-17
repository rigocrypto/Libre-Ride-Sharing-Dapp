// Type declarations to help the TypeScript language server resolve workspace aliases in editor
// These provide precise re-exports for the important shared module so editors can find types.

declare module "@shared/schema" {
  export * from "../shared/schema";
}

declare module "@shared/*" {
  const whatever: any;
  export default whatever;
}
