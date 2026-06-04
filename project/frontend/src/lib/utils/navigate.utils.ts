import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface NavigateToOptions {
  router?: AppRouterInstance;
  url?: string;
  action?: () => void;
}
const navigateTo = ({ router, url, action }: NavigateToOptions) => {
  if (!router) return;
  if (url) {
    return router.push(url);
  } else if (action) {
    action();
  }
};

export { navigateTo };
