import { Component, input, signal, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { Anime, Episode, Voice } from '../../models/anime.model';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-black overflow-hidden border border-white/5 shadow-2xl">
      <!-- Video Stage -->
      <div class="aspect-video bg-[#0a0a0a] relative group flex items-center justify-center border-b-4 border-primary">
        @if (currentVideoUrl()) {
          <video 
            class="w-full h-full z-10" 
            [src]="currentVideoUrl()" 
            controls 
            autoplay
          ></video>
        } @else {
          <img 
            [src]="anime().posterUrl" 
            class="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20"
            alt="Background"
          />
          
          <div class="z-10 flex flex-col items-center gap-6">
             <div (click)="startPlayback()" class="w-24 h-24 bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 transform group-hover:scale-110 group-hover:rotate-45 transition-all duration-500 cursor-pointer" role="button" tabindex="0">
              <span class="material-icons text-black text-5xl -rotate-0 group-hover:-rotate-45 transition-all">play_arrow</span>
            </div>
            <p class="text-white font-black uppercase tracking-[0.4em] text-[10px]">Initialize Stream</p>
          </div>
        }
      </div>

      <!-- Player Meta -->
      <div class="p-10 bg-white/[0.02] flex flex-col md:flex-row gap-12">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-4">
             @if (activeEpisode(); as ep) {
               <span class="bg-primary text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">Епізод {{ ep.number }}</span>
             }
             <span class="text-[10px] font-black text-white/30 uppercase tracking-widest">{{ anime().year }}</span>
          </div>
          <h2 class="text-5xl font-black uppercase italic tracking-tighter mb-6">{{ anime().titleUa }}</h2>
          <p class="text-white/50 text-sm leading-relaxed brutalist-border">
            {{ anime().descriptionUa }}
          </p>
        </div>

        <!-- Voice Selection -->
        <div class="w-full md:w-72 border-l border-white/5 pl-0 md:pl-12">
          <h3 class="text-[10px] font-black uppercase text-white/30 mb-6 italic tracking-[0.3em]">Audio Feed</h3>
          <div class="flex flex-col gap-3">
            @for (voice of currentEpisodeVoices(); track voice.id) {
              <button 
                (click)="selectVoice(voice)"
                [class.bg-primary]="selectedVoice()?.id === voice.id"
                [class.text-black]="selectedVoice()?.id === voice.id"
                [class.bg-white/5]="selectedVoice()?.id !== voice.id"
                [class.text-white/40]="selectedVoice()?.id !== voice.id"
                class="text-[10px] font-black py-4 px-6 flex items-center justify-between uppercase tracking-widest transition-all"
              >
                <span>{{ voice.voiceActor }}</span>
                @if (selectedVoice()?.id === voice.id) {
                  <span class="material-icons text-sm">radio_button_checked</span>
                }
              </button>
            } @empty {
              <div class="text-[10px] text-white/20 uppercase font-black">Дані завантажуються...</div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Episode List -->
    <div class="mt-16">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h3 class="text-3xl font-black uppercase italic tracking-tighter">DATA STREAM</h3>
          <div class="h-1 w-12 bg-primary mt-1"></div>
        </div>
        <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{{ episodes().length }} SECTIONS LOADED</span>
      </div>
      
      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1">
        @for (ep of episodes(); track ep.id) {
          <button 
            (click)="selectEpisode(ep)"
            [class.bg-primary]="activeEpisode()?.id === ep.id"
            [class.text-black]="activeEpisode()?.id === ep.id"
            [class.bg-white/5]="activeEpisode()?.id !== ep.id"
            [class.text-white/30]="activeEpisode()?.id !== ep.id"
            class="h-12 aspect-square flex items-center justify-center font-black text-xs hover:bg-primary hover:text-black transition-all border border-white/5"
          >
            {{ ep.number }}
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoPlayer {
  private animeService = inject(AnimeService);
  anime = input.required<Anime>();
  
  protected episodes = signal<Episode[]>([]);
  protected activeEpisode = signal<Episode | null>(null);
  protected currentEpisodeVoices = signal<Voice[]>([]);
  protected selectedVoice = signal<Voice | null>(null);
  protected currentVideoUrl = signal<string | null>(null);

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
    // If video is already playing, switch source immediately
    if (this.currentVideoUrl()) {
      this.currentVideoUrl.set(voice.fileUrl);
    }
  }

  startPlayback() {
    if (this.selectedVoice()) {
      this.currentVideoUrl.set(this.selectedVoice()!.fileUrl);
    }
  }
}

