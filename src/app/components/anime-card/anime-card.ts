import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Anime } from '../../models/anime.model';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [],
  template: `
    <div class="relative group overflow-hidden bg-bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 shadow-2xl cursor-pointer">
      <!-- Poster -->
      <div class="aspect-[2/3] overflow-hidden relative">
        <img 
          [src]="anime().posterUrl" 
          [alt]="anime().titleUa"
          class="w-full h-full object-cover group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
          loading="lazy"
        />
        <div class="absolute inset-0 anime-card-gradient pointer-events-none"></div>
        
        <!-- Badges -->
        <div class="absolute top-0 right-0 flex flex-col gap-0">
          <div class="bg-primary px-2 py-1 flex items-center gap-1">
            <span class="text-[10px] font-black text-black uppercase tracking-tighter">{{ anime().rating }}</span>
          </div>
          @if (anime().status === 'ongoing') {
            <div class="bg-white px-2 py-1 text-[8px] font-black uppercase tracking-tighter text-black">
              LIVE
            </div>
          }
        </div>
      </div>

      <!-- Info -->
      <div class="p-3 absolute bottom-0 left-0 right-0">
        <h3 class="text-[11px] font-black line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight leading-none mb-1">
          {{ anime().titleUa }}
        </h3>
        <p class="text-[9px] font-bold text-white/30 flex items-center gap-2 uppercase tracking-widest">
          <span>{{ anime().year }}</span>
          <span class="text-primary">/</span>
          <span>{{ anime().genres[0] }}</span>
        </p>
      </div>

      <!-- Red Accent Bar -->
      <div class="absolute bottom-0 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-500"></div>

      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimeCard {
  anime = input.required<Anime>();
}
