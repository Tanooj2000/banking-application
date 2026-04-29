export const ROOT_ADMIN_THEME_KEY = 'rootAdminTheme';

export const getInitialRootAdminTheme = () => {
  const savedTheme = localStorage.getItem(ROOT_ADMIN_THEME_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return 'dark';
};

export const setRootAdminTheme = (theme) => {
  localStorage.setItem(ROOT_ADMIN_THEME_KEY, theme);
};
