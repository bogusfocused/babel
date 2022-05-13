// copied initial code from https://github.com/koajs/compose
// MIT License
export type Next = () => Promise<void>;
export type Middleware<C = any> = {
  (context: C, next?: Next): Promise<void>;
};

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 */

export function compose<C = any>(middleware: Middleware<C>[]): Middleware<C> {
  if (!Array.isArray(middleware)) throw new TypeError("Middleware stack must be an array!");
  for (const fn of middleware) {
    if (typeof fn !== "function") throw new TypeError("Middleware must be composed of functions!");
  }

  return async function (ctx, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i: number): Promise<void> {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;
      let fn: Middleware<C> | Next | undefined = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
