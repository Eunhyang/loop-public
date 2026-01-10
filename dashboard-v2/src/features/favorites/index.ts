export { FavoriteStarButton } from './components/FavoriteStarButton';
export { FavoriteCard } from './components/FavoriteCard';
export { FavoritesStrip } from './components/FavoritesStrip';
export { useFavorites } from './hooks/useFavorites';
export { toggleFavorite, isFavorited, pruneFavorites, resetFavorites } from './store/favoritesStore';
export type { FavoritesStorage, EntityType } from './types';
export { FAVORITES_STORAGE_KEY, MAX_FAVORITES_PER_TYPE } from './constants';
