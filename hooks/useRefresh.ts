import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';

/**
 * Wires up the pull-down-from-the-top refresh gesture. Returns the props a
 * RefreshControl needs, plus the handler so the tab-press hook below can
 * trigger the exact same refresh.
 */
export function usePullToRefresh(refresh: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}

/**
 * Tapping the tab you're already on scrolls back to the top and refreshes —
 * the behaviour Instagram, X and most social apps have. React Navigation
 * fires 'tabPress' for every tab tap, so this checks isFocused() to tell
 * "re-tapped the current tab" apart from "navigated here from another tab".
 *
 * Pass the same ref you attach to the screen's ScrollView or FlatList.
 */
export function useTabPressRefresh(
  scrollRef: React.RefObject<any>,
  onRefresh: () => void
) {
  const navigation = useNavigation();
  // Ref-held so re-registering the listener isn't needed when the callback
  // identity changes between renders.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener?.('tabPress', () => {
      if (!navigation.isFocused?.()) return; // arriving from another tab — leave it alone

      const scrollable = scrollRef.current;
      if (scrollable?.scrollTo) {
        scrollable.scrollTo({ y: 0, animated: true }); // ScrollView
      } else if (scrollable?.scrollToOffset) {
        scrollable.scrollToOffset({ offset: 0, animated: true }); // FlatList
      }

      onRefreshRef.current();
    });

    return unsubscribe;
  }, [navigation, scrollRef]);
}