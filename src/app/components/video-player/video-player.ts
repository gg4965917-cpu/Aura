import { Component, input, signal, ChangeDetectionStrategy, inject, effect, computed } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { Anime, Episode, Voice } from '../../models/anime.model';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-10">
      <!-- Player Unit -->
      <div class="aura-glass-dark rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(236,72,153,0.2)] relative">
        <!-- Video Stage -->
        <div class="aspect-video bg-[#050105] relative group flex items-center justify-center">
          
          @if (safeEmbedUrl()) {
            <div class="absolute inset-0 bg-black flex items-center justify-center z-0">
               <div class="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            </div>
            <iframe 
              [src]="safeEmbedUrl()!" 
              class="w-full h-full border-0 absolute inset-0 z-10"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer" 
              allowfullscreen
              sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
            ></iframe>
          } @else if (currentVideoUrl()) {
            <video 
              #videoPlayer
              class="w-full h-full z-10" 
              [src]="currentVideoUrl()!" 
              controls 
              autoplay
              playsinline
              (error)="handleVideoError()"
            ></video>
          } @else {
            <!-- Placeholder State -->
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-10 p-12 text-center z-20">
              <div 
                (click)="startPlayback()" 
                class="w-32 h-32 bg-gradient-to-tr from-primary via-aura-accent to-pink-500 flex items-center justify-center rounded-[2.8rem] shadow-[0_0_60px_rgba(236,72,153,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer group/play animate-float"
              >
                <span class="material-icons text-7xl text-white group-hover/play:scale-110 transition-transform">play_arrow</span>
              </div>
              <div class="space-y-4">
                <h3 class="text-3xl md:text-4xl font-display font-black uppercase tracking-widest text-white aura-glow-text italic">AURA NEURAL LINK</h3>
                <p class="text-white/30 text-[10px] font-black uppercase tracking-[0.6em]">ВИБЕРІТЬ ДЖЕРЕЛО ДЛЯ СИНХРОНІЗАЦІЇ</p>
              </div>
            </div>
            <img [src]="anime().posterUrl" class="absolute inset-0 w-full h-full object-cover blur-3xl opacity-10 animate-pulse" alt="BG">
          }

          <!-- Corner Tags -->
          <div class="absolute top-8 left-8 z-30 pointer-events-none">
            <div class="aura-glass px-5 py-2.5 rounded-2xl flex items-center gap-3">
              <div class="w-2 h-2 bg-primary rounded-full animate-ping"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-white/60">Aura Stream v3.0</span>
            </div>
          </div>
        </div>

        <!-- Meta & Selectors -->
        <div class="p-8 md:p-16 bg-gradient-to-b from-aura-card/40 to-aura-card/90 backdrop-blur-3xl border-t border-white/5">
          <div class="flex flex-col xl:flex-row gap-20">
            <div class="flex-1 space-y-12">
              <div class="flex flex-col gap-6">
                 <div class="flex items-center gap-6">
                   <span class="aura-glass border-primary/30 text-primary px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em]">SERIES • E{{ activeEpisode()?.number }}</span>
                   <div class="h-px flex-1 bg-white/5"></div>
                 </div>
                 <h2 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter italic aura-gradient-text drop-shadow-2xl">
                   {{ activeEpisode()?.titleUa || 'Initialization...' }}
                 </h2>
              </div>
              
              <!-- Episode Grid -->
              <div class="space-y-8">
                <div class="flex items-center justify-between px-2">
                  <h4 class="text-[10px] font-black uppercase text-white/20 tracking-[0.5em]">Episode Matrix</h4>
                  <span class="text-[10px] font-mono text-primary/40">Status: Online</span>
                </div>
                <div class="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
                  @for (ep of episodes(); track ep.id) {
                    <button 
                      (click)="selectEpisode(ep)"
                      [class.bg-primary]="activeEpisode()?.id === ep.id"
                      [class.text-white]="activeEpisode()?.id === ep.id"
                      [class.shadow-[0_0_30px_rgba(236,72,153,0.4)]]="activeEpisode()?.id === ep.id"
                      [class.aura-glass]="activeEpisode()?.id !== ep.id"
                      class="flex-shrink-0 w-20 h-20 rounded-[1.8rem] flex items-center justify-center font-display font-black text-3xl transition-all hover:scale-110 active:scale-90 border-white/10"
                    >
                      {{ ep.number }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Side Source Panel -->
            <div class="w-full xl:w-[420px] space-y-10">
              <div class="aura-glass p-12 rounded-[3.5rem] border-white/10 relative overflow-hidden">
                <div class="absolute -top-4 -right-4 p-12 opacity-5">
                   <span class="material-icons text-9xl">graphic_eq</span>
                </div>
                
                <h3 class="text-[10px] font-black uppercase text-primary mb-12 tracking-[0.6em] flex items-center gap-5">
                  <span class="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ec4899]"></span>
                  AUDIO FEED
                </h3>
                
                <div class="space-y-5">
                  @for (voice of currentEpisodeVoices(); track voice.id) {
                    <button 
                      (click)="selectVoice(voice)"
                      [class.bg-white/10]="selectedVoice()?.id === voice.id"
                      [class.border-primary/40]="selectedVoice()?.id === voice.id"
                      [class.text-primary]="selectedVoice()?.id === voice.id"
                      class="group w-full flex items-center justify-between p-7 rounded-[2rem] border border-white/5 hover:bg-white/5 hover:border-primary/20 transition-all text-left aura-glow hover:aura-glow"
                    >
                      <div class="flex flex-col gap-2">
                        <span class="text-[9px] opacity-30 uppercase font-black tracking-[0.2em]">{{ voice.voiceType }}</span>
                        <span class="font-black text-base uppercase tracking-tight">{{ voice.voiceActor }}</span>
                      </div>
                      <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <span class="material-icons text-2xl">{{ selectedVoice()?.id === voice.id ? 'graphic_eq' : 'link' }}</span>
                      </div>
                    </button>
                  } @empty {
                    <div class="py-20 text-center aura-glass rounded-[3rem] border-dashed border-white/10">
                      <span class="material-icons text-white/5 text-6xl mb-6">sensors_off</span>
                      <p class="text-[10px] text-white/20 uppercase font-black tracking-widest">No Sources Linked</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Footer -->
      <div class="flex flex-col lg:flex-row gap-16 p-12 aura-glass rounded-[3.5rem] relative overflow-hidden group">
        <div class="absolute -bottom-10 -right-10 text-[180px] font-black text-white/[0.02] italic pointer-events-none select-none transition-transform group-hover:scale-110">
          INFO
        </div>
        <div class="flex-1 space-y-8 relative z-10">
          <h4 class="text-[10px] font-black uppercase tracking-[0.6em] text-primary flex items-center gap-3">
             <div class="w-6 h-px bg-primary/30"></div>
             SYNAPSE DATA
          </h4>
          <p class="text-lg md:text-xl leading-relaxed max-w-4xl font-medium text-white/60 italic border-l-4 border-primary/20 pl-10">
            "{{ anime().descriptionUa }}"
          </p>
        </div>
        <div class="flex flex-wrap gap-4 items-start lg:justify-end xl:w-96 relative z-10">
           @for (genre of anime().genres; track genre) {
             <span class="aura-glass px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white hover:border-primary transition-all cursor-default">
               {{ genre }}
             </span>
           }
        </div>
      </div>
    </div>
  `
})
export class VideoPlayer {
  private animeService = inject(AnimeService);
  private sanitizer = inject(DomSanitizer);
  
  anime = input.required<Anime>();
  
  protected episodes = signal<Episode[]>([]);
  protected activeEpisode = signal<Episode | null>(null);
  protected currentEpisodeVoices = signal<Voice[]>([]);
  protected selectedVoice = signal<Voice | null>(null);
  protected currentVideoUrl = signal<string | null>(null);

  protected safeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const voice = this.selectedVoice();
    if (voice && voice.embedUrl) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(voice.embedUrl);
    }
    return null;
  });

  constructor() {
    effect(() => {
      const animeId = this.anime().id;
      if (animeId) {
        this.loadEpisodes(animeId);
      }
    });
  }

  private async loadEpisodes(animeId: string) {
    const list = await this.animeService.getEpisodes(animeId);
    this.episodes.set(list);
    if (list.length > 0) {
      this.selectEpisode(list[0]);
    }
  }

  selectEpisode(ep: Episode) {
    this.activeEpisode.set(ep);
    this.currentEpisodeVoices.set(ep.voices || []);
    if (ep.voices && ep.voices.length > 0) {
      this.selectVoice(ep.voices[0]);
    } else {
      this.selectedVoice.set(null);
      this.currentVideoUrl.set(null);
    }
  }

  selectVoice(voice: Voice) {
    this.selectedVoice.set(voice);
    // Force refresh the player state
    this.currentVideoUrl.set(null);
    this.updateMediaSource(voice);
  }

  private updateMediaSource(voice: Voice) {
    if (!this.selectedVoice()) return;
    
    // Use a slight delay to ensure the DOM elements are reset correctly
    setTimeout(() => {
      if (voice.fileUrl) {
        this.currentVideoUrl.set(voice.fileUrl);
      }
    }, 50);
  }

  startPlayback() {
    const voice = this.selectedVoice();
    if (voice) {
      this.updateMediaSource(voice);
    }
  }

  handleVideoError() {
    console.error('Video loading error at URL:', this.currentVideoUrl());
  }
}


