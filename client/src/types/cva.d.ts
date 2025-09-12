import * as React from "react"

declare module 'class-variance-authority/types' {
  type CxOptions = ClassValue[]
  type CxReturn = string
  type Cx = (...inputs: CxOptions) => CxReturn
  
  export type ClassValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | { [key: string]: boolean | undefined | null }
    | ClassValue[]
    
  export interface VariantProps<T> {
    className?: string
    [key: string]: any
  }
  
  export interface VariantConfig<T> {
    variants: {
      [key: string]: {
        [key: string]: string
      }
    }
    defaultVariants?: {
      [key: string]: string
    }
    compoundVariants?: Array<{
      [key: string]: string
      class: string
    }>
  }
  
  export function cva<T extends VariantConfig<T>>(
    base: string,
    config?: T
  ): (props?: VariantProps<T>) => string
  
  export function cx(...inputs: ClassValue[]): string
}

declare module 'class-variance-authority' {
  export * from 'class-variance-authority/types'
}
