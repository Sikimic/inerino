export const environment = (): string => {
  return global['ENV_NAME'] || 'development';
};
