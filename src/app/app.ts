import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimeService } from './services/anime.service';
import { UserService } from './services/user.service';
import { UserActivityService } from './services/user-activity.service';
import { AnimeCard } from './components/anime-card/anime-card';
import { VideoPlayer } from './components/video-player/video-player';
import { Anime } from './models/anime.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [AnimeCard, VideoPlayer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private platformId = inject(PLATFORM_ID);
  private animeService = inject(AnimeService);
  public userService = inject(UserService);
  public activityService = inject(UserActivityService);
  
  animeList = this.animeService.getAnimeList();
  
  featuredAnime = computed(() => {
    const list = this.animeList();
    return list.length > 0 ? list[0] : null;
  });

  isFeaturedInWatchlist = computed(() => {
    const anime = this.featuredAnime();
    return anime ? this.activityService.isInWatchlist(anime.id)() : false;
  });
  
  categories = signal(['Всі', 'Екшн', 'Сьонен', 'Драма', 'Фентезі', 'Комедія', 'Пригоди', 'Надприродне']);
  activeCategory = signal('Всі');

  currentView = signal<'catalog' | 'player'>('catalog');
  selectedAnime = signal<Anime | null>(null);

  filteredAnimeList = computed(() => {
    const list = this.animeList();
    const category = this.activeCategory();
    if (category === 'Всі') return list;
    return list.filter(anime => anime.genres?.includes(category));
  });

  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  showPlayer(anime: Anime) {
    this.selectedAnime.set(anime);
    this.currentView.set('player');
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  showCatalog() {
    this.currentView.set('catalog');
    this.selectedAnime.set(null);
  }
}
