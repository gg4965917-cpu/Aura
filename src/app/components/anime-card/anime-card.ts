import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Anime } from '../../models/anime.model';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [],
  template: `
    <div class="relative group overflow-hidden bg-aura-card border border-white/5 hover:border-primary/40 transition-all duration-700 shadow-2xl rounded-[2.5rem] cursor-pointer shadow-[0_0_0_rgba(236,72,153,0)] hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)] active:scale-95">
      <!-- Poster -->
      <div class="aspect-[2/3] overflow-hidden relative">
        <img 
          [src]="anime().posterUrl" 
          [alt]="anime().titleUa"
          class="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 saturate-[0.6] group-hover:saturate-120"
          loading="lazy"
        />
        <div class="absolute inset-0 anime-card-gradient pointer-events-none"></div>
        
        <!-- Badges -->
        <div class="absolute top-5 left-5 flex flex-col gap-2">
          <div class="aura-glass px-3 py-1.5 flex items-center gap-1.5 rounded-[1rem] backdrop-blur-xl border-white/20">
            <span class="text-accent text-[12px] scale-90">★</span>
            <span class="text-[11px] font-black text-white uppercase tracking-tighter">{{ anime().rating }}</span>
          </div>
        </div>

        @if (anime().status === 'ongoing') {
          <div class="absolute top-5 right-5 bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 text-[9px] font-black uppercase rounded-[1rem] backdrop-blur-xl flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            ON AIR
          </div>
        }
      </div>

      <!-- Info -->
      <div class="p-6 absolute bottom-0 left-0 right-0 z-10 space-y-2">
        <div class="flex items-center gap-3">
          <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] font-mono">{{ anime().genres[0] }}</span>
          <div class="h-px w-8 bg-white/10"></div>
        </div>
        <h3 class="text-sm md:text-base font-display font-black line-clamp-1 group-hover:aura-gradient-text transition-all uppercase tracking-tight leading-none">
          {{ anime().titleUa }}
        </h3>
      </div>

      <!-- Neural Overlay -->
      <div class="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
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
