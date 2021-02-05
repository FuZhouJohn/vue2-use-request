import { ref } from "@vue/composition-api";

export const ConfigContextService = Symbol("conifgContext");
export default function useConfigContextService() {
  const config = ref({});
  config.value = {
    ...config.value,
    displayName: "UseRequestConfigContext"
  };
  return {
    config
  };
}
