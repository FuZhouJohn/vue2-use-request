import {
  onMounted,
  ref,
  toRefs,
  reactive,
  toRef,
  watch
} from "@vue/composition-api";
const DEFAULT_KEY = "VUE3_USE_REQUEST_DEFAULT_KEY";
class Fetch {
  constructor(service, config, initState) {
    this.that = this;
    this.count = 0;
    this.unmountedFlag = false;
    this.state = reactive({
      loading: false,
      params: [],
      data: undefined,
      error: undefined,
      run: this.run.bind(this.that),
      refresh: this.refresh.bind(this.that)
    });

    this.service = service;
    this.config = config;
    if (initState) {
      for (const key in initState) {
        this.state[key] = initState[key];
      }
    }
  }

  setState(s = {}) {
    for (const sKey in s) {
      this.state[sKey] = s[sKey];
    }
  }

  _run(...args) {
    this.count += 1;
    const currentCount = this.count;

    this.setState({
      loading: true,
      params: args
    });

    return this.service(...args)
      .then(res => {
        if (!this.unmountedFlag && currentCount === this.count) {
          const formattedResult = this.config.formatResult
            ? this.config.formatResult(res)
            : res;
          this.setState({
            data: formattedResult,
            error: undefined,
            loading: false
          });
          if (this.config.onSuccess) {
            this.config.onSuccess(formattedResult, args);
          }
          return formattedResult;
        }
      })
      .catch(error => {
        if (!this.unmountedFlag && currentCount === this.count) {
          this.setState({
            data: undefined,
            error,
            loading: false
          });
          console.error(error);
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject(
            "useAsync has caught the exception, if you need to handle the exception yourself, you can set options.throwOnError to true."
          );
        }
      });
  }

  run(...args) {
    return this._run(...args);
  }

  refresh() {
    return this.run(...this.state.params);
  }
}

export default function useAsync(service, options) {
  const _options = options || {};
  const {
    refreshDeps = [],
    manual = false,
    onSuccess = () => {},
    defaultLoading = false,
    defaultParams = [],
    fetchKey
  } = _options;

  const state = reactive({
    loading: false || defaultLoading,
    data: undefined,
    error: undefined,
    params: []
  });

  const newstFetchKey = ref(DEFAULT_KEY);

  // 持久化函数
  const servicePersist = usePersistFn(service);
  const onSuccessPersist = usePersistFn(onSuccess);
  const fetchKeyPersist = usePersistFn(fetchKey);

  let formatResult;
  if ("formatResult" in _options) {
    formatResult = _options.formatResult;
  }
  const formatResultPersist = usePersistFn(formatResult);

  const config = {
    formatResult: formatResultPersist,
    onSuccess: onSuccessPersist
  };

  const fetchesRef = ref({});

  const setState = s => {
    for (const sKey in s) {
      state[sKey] = toRef(s, sKey);
    }
  };
  const run = (...args) => {
    if (fetchKeyPersist) {
      const key = fetchKeyPersist(...args);
      newstFetchKey.value = key === undefined ? DEFAULT_KEY : key;
    }
    const currentFetchKey = newstFetchKey.value;
    let currentFetch = fetchesRef.value[currentFetchKey];
    if (!currentFetch) {
      const newFetch = new Fetch(servicePersist, config, {});
      currentFetch = newFetch.state;
      setState(currentFetch);
      fetchesRef.value = {
        ...fetchesRef.value,
        [currentFetchKey]: currentFetch
      };
    }
    return currentFetch.run(...args);
  };

  onMounted(() => {
    if (!manual) {
      run(...defaultParams);
    }
  });

  watch([...refreshDeps], () => {
    if (!manual) {
      Object.values(fetchesRef.value).forEach(f => {
        f.refresh();
      });
    }
  });

  return {
    ...toRefs(state),
    run,
    fetches: fetchesRef
  };
}
function usePersistFn(fn) {
  const persist = (...args) => {
    const refFn = fn;
    if (refFn) {
      return refFn(...args);
    }
  };
  if (typeof fn === "function") {
    return persist;
  }
  return undefined;
}
