declare module 'react' {
  export = React;
  export as namespace React;
  namespace React {
    interface FC<P = {}> {
      (props: P): any;
    }
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    interface ChangeEvent<T = Element> {
      target: T;
    }
    function forwardRef<T, P = {}>(render: (props: P, ref: any) => any): any;
    type HTMLAttributes<T> = any;
    type ButtonHTMLAttributes<T> = any;
    type InputHTMLAttributes<T> = any;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 