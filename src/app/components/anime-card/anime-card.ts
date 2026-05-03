import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Anime } from '../../models/anime.model';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [],
  template: `
    <div class="relative group overflow-hidden bg-aura-card border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-2xl rounded-2xl cursor-pointer aura-glow">
      <!-- Poster -->
      <div class="aspect-[2/3] overflow-hidden relative">
        <img 
          [src]="anime().posterUrl" 
          [alt]="anime().titleUa"
          class="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 saturate-[0.8] group-hover:saturate-100"
          loading="lazy"
        />
        <div class="absolute inset-0 anime-card-gradient pointer-events-none"></div>
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-2">
          <div class="glass px-2 py-1 flex items-center gap-1 rounded-lg backdrop-blur-md border-white/20">
            <span class="text-accent text-[10px] scale-75">★</span>
            <span class="text-[10px] font-black text-white uppercase tracking-tighter">{{ anime().rating }}</span>
          </div>
        </div>

        @if (anime().status === 'ongoing') {
          <div class="absolute top-3 right-3 bg-primary/20 text-primary border border-primary/20 px-2 py-1 text-[8px] font-black uppercase rounded-lg backdrop-blur-md">
            ON AIR
          </div>
        }
      </div>

      <!-- Info -->
      <div class="p-4 absolute bottom-0 left-0 right-0 z-10">
        <div class="mb-1 flex items-center gap-2">
          <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:animate-ping"></span>
          <span class="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{{ anime().genres[0] }}</span>
        </div>
        <h3 class="text-xs font-display font-[900] line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight leading-none">
          {{ anime().titleUa }}
        </h3>
      </div>

      <!-- Glow Effect -->
      <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
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
