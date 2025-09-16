declare module '@/components/icons' {
  import { ComponentType, SVGProps } from 'react';

  interface IconProps extends SVGProps<SVGSVGElement> {
    className?: string;
  }

  export const Icons: {
    [key: string]: ComponentType<IconProps>;
  };

  export type IconName = keyof typeof Icons;
}
