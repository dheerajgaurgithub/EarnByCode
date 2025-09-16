import { ComponentType, SVGProps } from 'react';

declare module '@/components/icons' {
  interface IconProps extends SVGProps<SVGSVGElement> {
    className?: string;
  }

  export const Icons: {
    wallet: ComponentType<IconProps>;
    arrowDown: ComponentType<IconProps>;
    arrowUp: ComponentType<IconProps>;
    clock: ComponentType<IconProps>;
    spinner: ComponentType<IconProps>;
    checkCircle: ComponentType<IconProps>;
    xCircle: ComponentType<IconProps>;
    info: ComponentType<IconProps>;
    arrowLeft: ComponentType<IconProps>;
    refreshCw: ComponentType<IconProps>;
    repeat: ComponentType<IconProps>;
    x: ComponentType<IconProps>;
  };

  export type IconName = keyof typeof Icons;
}
