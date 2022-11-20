import { ref, shallowRef } from "../reactivity";

type AsyncLoader = () => Promise<any>;

type LoaderOptions = {
  loader: AsyncLoader;
  timeout: number;
  /**
   * loading 的延时
   * */
  delay: number;
  loadingComponent: any;
  errorComponent: any;
};

export function defineAsynComponent(
  options: AsyncLoader | Partial<LoaderOptions>
) {
  let loaderOption: Partial<LoaderOptions> = {};
  if (typeof options === "function") {
    loaderOption.loader = options;
  } else {
    loaderOption = {
      ...options,
    };
  }

  const { loader } = loaderOption;

  let InnerComp = null;
  return {
    name: "AsyncComponentWrapper",
    setup() {
      const loaded = ref(false);
      const error = shallowRef(null);
      const loading = ref(false);

      let timer = null;

      if (loaderOption.timeout) {
        timer = setTimeout(() => {
          const err = new Error(
            `Async component timed out after ${loaderOption.timeout} ms.`
          );

          error.value = err;
        }, loaderOption.timeout);
      }
      let loadingTimer: ReturnType<typeof setTimeout>;
      if (loaderOption.delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true;
        }, loaderOption.delay);
      } else {
        loading.value = true;
      }

      loader!()
        .then((c) => {
          InnerComp = c;
          loaded.value = true;
        })
        .catch((err) => {
          error.value === err;
        })
        .finally(() => {
          loading.value = false;
          clearTimeout(loadingTimer);
        });

      const placeholder = { type: "div", children: "haha" };

      return () => {
        if (loaded.value) {
          // 返回成功的组件
          return;
        }
        if (error.value && loaderOption.errorComponent) {
          // 超时显示 error 组件
          return { type: loaderOption.errorComponent };
        }

        if (loading.value && loaderOption.loadingComponent) {
          return { type: loaderOption.loadingComponent };
        }

        return placeholder;
      };
    },
  };
}
