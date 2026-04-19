let resolveCallback: (value: boolean) => void;

const confirmDefaults = {
  title: "Are you sure?",
  description: "You cant decline that",
  confirmText: "Delete",
};

export const useConfirm = () => {
  const isOpen = useState("confirm-is-open", () => false);
  const loading = useState("confirm-loading", () => false);
  const settled = useState("confirm-settled", () => true);
  const config = useState("confirm-config", () => ({ ...confirmDefaults }));

  const ask = (options?: Partial<{
    title: string;
    description: string;
    confirmText: string;
  }>) => {
    config.value = { ...confirmDefaults, ...options };
    settled.value = false;
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolveCallback = resolve;
    });
  };

  const confirm = () => {
    if (settled.value) return;
    settled.value = true;
    isOpen.value = false;
    resolveCallback(true);
  };

  const cancel = () => {
    if (settled.value) return;
    settled.value = true;
    isOpen.value = false;
    resolveCallback(false);
  };

  return { isOpen, loading, config, ask, confirm, cancel };
};
