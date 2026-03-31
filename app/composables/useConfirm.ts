let resolveCallback: (value: boolean) => void;

export const useConfirm = () => {
  const isOpen = useState('confirm-is-open', () => false);
  const loading = useState('confirm-loading', () => false);
  const config = useState('confirm-config', () => ({
    title: 'Are you sure?',
    description: 'You cant decline that',
    confirmText: 'Delete',
  }));

  const ask = (options?: Partial<typeof config.value>) => {
    if (options) config.value = { ...config.value, ...options };
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolveCallback = resolve;
    });
  };

  const confirm = () => {
    isOpen.value = false;
    resolveCallback(true);
  };

  const cancel = () => {
    isOpen.value = false;
    resolveCallback(false);
  };

  return { isOpen, loading, config, ask, confirm, cancel };
};
