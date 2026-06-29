declare global {
  interface ImportMetaEnv {
    readonly [key: string]: string | boolean | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module "*.svg" {
  import type { ComponentType, SVGProps } from "react";
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export { ReactComponent };
  const src: string;
  export default src;
}

export {};
