import { useAsync } from "@/tools/useRequest/index";
import { computed, reactive, watch } from "@vue/composition-api";

function usePaginated(service, options) {
  const {
    defaultPageSize = 10,
    refreshDeps = [],
    fetchKey,
    ...restOptions
  } = options;
  if (fetchKey) {
    console.error("useRequest pagination's fetchKey will not work!");
  }

  const { data, params, run, loading, ...rest } = useAsync(service, {
    defaultParams: [
      {
        current: 1,
        pageSize: defaultPageSize
      }
    ],
    ...restOptions
  });

  const pageSize = computed(() => {
    return (
      (params.value && params.value[0] && params.value[0].pageSize) ||
      defaultPageSize
    );
  });
  const current = computed(() => {
    return (params.value && params.value[0] && params.value[0].current) || 1;
  });
  const sorter = computed(() => {
    return (params.value && params.value[0] && params.value[0].sorter) || {};
  });
  const filters = computed(() => {
    return (params.value && params.value[0] && params.value[0].filters) || {};
  });

  const runChangePaination = paginationParams => {
    const [oldPaginationParams, ...restParams] = params.value;
    run(
      {
        ...oldPaginationParams,
        ...paginationParams
      },
      ...restParams
    );
  };
  const total = computed(() => (data.value && data.value.total) || 0);

  const totalPage = computed(() => {
    console.log();
    return Math.ceil(total.value / pageSize.value);
  });

  const onChange = (c, p) => {
    let toCurrent = c <= 0 ? 1 : c;
    const toPageSize = p <= 0 ? 1 : p;

    const tempTotalPage = Math.ceil(total.value / toPageSize);
    if (toCurrent > tempTotalPage) {
      toCurrent = tempTotalPage;
    }
    runChangePaination({
      current: toCurrent,
      pageSize: toPageSize
    });
  };

  const changeCurrent = c => {
    console.log("current change");
    onChange(c, pageSize.value);
  };

  const changePageSize = p => {
    console.log("pageSize change");
    onChange(current.value, p);
  };

  watch(
    [...refreshDeps],
    () => {
      if (!options.manual) {
        changeCurrent(1);
      }
    },
    { deep: true }
  );

  const changeTable = (p, f, s) => {
    runChangePaination({
      current: p.current,
      pageSize: p.pageSize || defaultPageSize,
      filters: f,
      sorter: s
    });
  };

  const tableData = computed(() => (data.value && data.value.list) || []);
  return {
    loading,
    data,
    params,
    run,
    pagination: reactive({
      currentPage: current,
      pageSize: pageSize,
      total,
      pageCount: totalPage,
      "current-change": changeCurrent,
      "size-change": changePageSize
    }),
    tableProps: reactive({
      data: tableData,
      loading,
      onChange: changeTable,
      pagination: {
        current: current,
        pageSize: pageSize,
        total
      }
    }),
    sorter: sorter,
    filters: filters,
    ...rest
  };
}

export default usePaginated;
