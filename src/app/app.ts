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
  searchQuery = signal('');
  mobileSearchActive = signal(false);

  filteredAnimeList = computed(() => {
    const list = this.animeList();
    const category = this.activeCategory();
    const query = this.searchQuery().toLowerCase().trim();
    
    let filtered = list;
    
    if (category !== 'Всі') {
      filtered = filtered.filter(anime => anime.genres?.includes(category));
    }
    
    if (query) {
      filtered = filtered.filter(anime => 
        anime.titleUa.toLowerCase().includes(query) || 
        anime.descriptionUa.toLowerCase().includes(query) ||
        anime.genres.some(g => g.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  });

  setSearchQuery(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  setCategory(category: string) {
    this.activeCategory.set(category);
  }

  scrollToCatalog() {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById('anime-catalog');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
    }
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
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
