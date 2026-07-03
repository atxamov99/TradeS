import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | TradeS`;
    }
    return () => {
      document.title = 'TradeS';
    };
  }, [title]);
}
