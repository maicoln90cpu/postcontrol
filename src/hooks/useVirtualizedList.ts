import { useRef, useEffect } from 'react';

// Type imports for react-window
type FixedSizeListType = {
  scrollToItem: (index: number, align?: string) => void;
};

/**
 * Hook para gerenciar listas virtualizadas com react-window
 * Otimiza performance para listas com 100+ items
 */
export const useVirtualizedList = <T,>({
  items,
  itemHeight,
  containerHeight = 600,
  overscanCount = 3, // Renderizar 3 items extras acima/abaixo
}: {
  items: T[];
  itemHeight: number;
  containerHeight?: number;
  overscanCount?: number;
}) => {
  const listRef = useRef<FixedSizeListType | null>(null);

  // Scroll para o topo ao mudar de página/filtro
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [items]);

  return {
    listRef,
    itemCount: items.length,
    itemHeight,
    containerHeight,
    overscanCount,
  };
};
