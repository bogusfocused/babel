import React, {
  ForwardRefRenderFunction,
  PropsWithoutRef,
  RefAttributes,
} from "react";
namespace ReactShim {
  function forwardRef<T, P = {}>(render: ForwardRefRenderFunction<T, P>) {
    return render;
  }
}
