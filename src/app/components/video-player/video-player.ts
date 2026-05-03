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
    <div class="flex flex-col gap-8">
      <!-- Player Unit -->
      <div class="glass-dark rounded-[2.5rem] overflow-hidden aura-glow border border-white/10 shadow-[0_20px_50px_rgba(236,72,153,0.2)]">
        <!-- Video Stage -->
        <div class="aspect-video bg-black relative group flex items-center justify-center">
          @if (safeEmbedUrl()) {
            <div class="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center z-0">
               <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
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
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center">
              <div 
                (click)="startPlayback()" 
                class="w-28 h-28 bg-gradient-to-tr from-primary to-aura-accent flex items-center justify-center rounded-[2rem] aura-glow hover:scale-110 active:scale-95 transition-all cursor-pointer group/play"
              >
                <span class="material-icons text-5xl text-white group-hover/play:scale-110 transition-transform">play_arrow</span>
              </div>
              <div>
                <h3 class="text-2xl font-display font-black uppercase tracking-widest text-white/90 mb-2 italic">Виберіть джерело озвучки</h3>
                <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Підключено понад 8 українських баз даних</p>
              </div>
            </div>
          }
        </div>

        <!-- Controls / Meta Info -->
        <div class="p-6 md:p-12 flex flex-col lg:flex-row gap-12 bg-aura-card/50">
          <div class="flex-1">
            <div class="flex items-center gap-5 mb-8">
               <span class="bg-primary/20 text-primary px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">Серія {{ activeEpisode()?.number || '??' }}</span>
               <h2 class="text-4xl font-display font-[900] uppercase tracking-tighter italic">{{ activeEpisode()?.titleUa || '...' }}</h2>
            </div>
            
            <!-- Episodes Browser -->
            <div class="mb-4">
              <h4 class="text-[10px] font-black uppercase text-white/30 mb-6 tracking-[0.3em]">Neural Section Select</h4>
              <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                @for (ep of episodes(); track ep.id) {
                  <button 
                    (click)="selectEpisode(ep)"
                    [class.bg-primary]="activeEpisode()?.id === ep.id"
                    [class.text-white]="activeEpisode()?.id === ep.id"
                    [class.aura-glow]="activeEpisode()?.id === ep.id"
                    [class.glass]="activeEpisode()?.id !== ep.id"
                    class="flex-shrink-0 w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-display font-[900] text-xl transition-all hover:scale-110 active:scale-90"
                  >
                    {{ ep.number }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Voice / Source Selection -->
          <div class="w-full lg:w-96 glass p-8 rounded-[2rem] border-white/10 aura-glow">
            <h3 class="text-[10px] font-black uppercase text-primary mb-8 italic tracking-[0.4em] flex items-center gap-2">
              <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Канали Озвучення
            </h3>
            <div class="grid grid-cols-1 gap-4">
              @for (voice of currentEpisodeVoices(); track voice.id) {
                <button 
                  (click)="selectVoice(voice)"
                  [class.bg-white/15]="selectedVoice()?.id === voice.id"
                  [class.border-primary]="selectedVoice()?.id === voice.id"
                  [class.text-primary]="selectedVoice()?.id === voice.id"
                  class="group flex items-center justify-between p-5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-left"
                >
                  <div class="flex flex-col">
                    <span class="text-[9px] opacity-40 uppercase font-black tracking-widest mb-1">{{ voice.voiceType }}</span>
                    <span class="font-black text-sm tracking-tight uppercase">{{ voice.voiceActor }}</span>
                  </div>
                  <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <span class="material-icons text-lg">play_arrow</span>
                  </div>
                </button>
              } @empty {
                <div class="py-12 text-center glass rounded-2xl border-dashed border-white/10">
                  <span class="material-icons text-white/10 text-4xl mb-4">cloud_off</span>
                  <p class="text-[10px] text-white/20 uppercase font-black tracking-widest">Джерела не знайдено</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Info Overlay -->
      <div class="flex flex-col md:flex-row gap-12 p-8 glass rounded-[2.5rem] opacity-80 hover:opacity-100 transition-opacity">
        <div class="flex-1">
          <h4 class="text-[10px] font-black uppercase tracking-[0.5em] mb-6 text-primary flex items-center gap-2">
            <span class="material-icons text-sm">info</span>
            СИНХРОНІЗАЦІЯ ДАНИХ
          </h4>
          <p class="text-sm leading-relaxed max-w-3xl font-medium text-white/70 italic">
            "{{ anime().descriptionUa }}"
          </p>
        </div>
        <div class="flex flex-wrap gap-3 items-start md:justify-end">
           @for (genre of anime().genres; track genre) {
             <span class="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:border-primary/50 transition-all cursor-default">
               #{{ genre }}
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
    if (this.currentVideoUrl() || this.safeEmbedUrl()) {
       this.updateMediaSource(voice);
    }
  }

  private updateMediaSource(voice: Voice) {
    this.currentVideoUrl.set(null);
    setTimeout(() => {
      if (voice.fileUrl) {
        this.currentVideoUrl.set(voice.fileUrl);
      }
    }, 0);
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


