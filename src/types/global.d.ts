// Declaration file for missing modules

// For @reach/router
declare module '@reach/router' {
  export function navigate(to: string): void;
  export const Router: any;
  export const Link: any;
}

// For any other missing modules
declare module '*' {
  const content: any;
  export default content;
} 