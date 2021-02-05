import useConfigContextService, {
  ConfigContextService
} from "@/tools/useRequest/configContext";
import { provide } from "@vue/composition-api";
import useAsync from "@/tools/useRequest/useAsync";
import usePaginated from "@/tools/useRequest/usePaginated";

function useRequest(service, options) {
  const { config: contextConfig } = useConfigContextService();
  provide(ConfigContextService, contextConfig);
  const finalOptions = { ...contextConfig.value, ...options };
  const { requestMethod, paginated } = finalOptions;

  const fetchProxy = (...args) =>
    fetch(...args).then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    });

  const finalRequestMethod = requestMethod || fetchProxy;

  let promiseService;
  switch (typeof service) {
    case "string":
      promiseService = () => finalRequestMethod(service);
      break;
    case "object":
      // eslint-disable-next-line no-case-declarations
      const { url, ...rest } = service;
      promiseService = () =>
        requestMethod ? requestMethod(service) : fetchProxy(url, rest);
      break;
    default:
      promiseService = (...args) =>
        new Promise((resolve, reject) => {
          const s = service(...args);
          let fn = s;
          if (!s.then) {
            switch (typeof s) {
              case "string":
                fn = finalRequestMethod(s);
                break;
              case "object":
                // eslint-disable-next-line no-case-declarations
                const { url, ...rest } = s;
                fn = requestMethod ? requestMethod(s) : fetchProxy(url, rest);
                break;
            }
          }
          fn.then(resolve).catch(reject);
        });
  }

  if (paginated) {
    return usePaginated(promiseService, finalOptions);
  }
  return useAsync(promiseService, finalOptions);
}

export { useAsync };
export default useRequest;
