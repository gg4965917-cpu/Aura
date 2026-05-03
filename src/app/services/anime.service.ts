import { Injectable, signal } from '@angular/core';
import { 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Anime, Episode, Voice } from '../models/anime.model';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  private animeListSignal = signal<Anime[]>([]);

  constructor() {
    this.loadCatalog();
  }

  async loadCatalog() {
    try {
      const animeCol = collection(db, 'anime');
      const animeSnapshot = await getDocs(animeCol);
      const list = animeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anime));
      
      if (list.length === 0) {
        await this.seedInitialData();
      } else {
        // Migration: Fix http links in existing data for Vercel poster stability
        const cleanedList = list.map(anime => ({
          ...anime,
          posterUrl: anime.posterUrl?.startsWith('http://') 
            ? anime.posterUrl.replace('http://', 'https://') 
            : anime.posterUrl
        }));
        this.animeListSignal.set(cleanedList);
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
    }
  }

  getAnimeList() {
    return this.animeListSignal;
  }

  async getEpisodes(animeId: string): Promise<Episode[]> {
    try {
      const epCol = collection(db, `anime/${animeId}/episodes`);
      const epSnapshot = await getDocs(epCol);
      
      const episodes: Episode[] = [];
      for (const epDoc of epSnapshot.docs) {
        const episodeData = epDoc.data();
        const voicesCol = collection(db, `anime/${animeId}/episodes/${epDoc.id}/voices`);
        const voicesSnapshot = await getDocs(voicesCol);
        const voices = voicesSnapshot.docs.map(vDoc => {
          const vData = vDoc.data();
          // Ensure HTTPS for Vercel
          let fileUrl = vData['fileUrl'] || '';
          let embedUrl = vData['embedUrl'] || '';
          
          if (fileUrl.startsWith('http://')) {
            fileUrl = fileUrl.replace('http://', 'https://');
          }
          if (embedUrl.startsWith('http://')) {
            embedUrl = embedUrl.replace('http://', 'https://');
          }
          
          // Fix specific broken links
          if (fileUrl.includes('w3schools.com/html/mov_bbb.mp4')) {
            fileUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          }
          
          return { id: vDoc.id, ...vData, fileUrl, embedUrl } as Voice;
        });
        
        episodes.push({
          id: epDoc.id,
          number: episodeData['number'] || 1,
          titleUa: episodeData['titleUa'] || `Серія ${episodeData['number'] || 1}`,
          durationSeconds: episodeData['durationSeconds'] || 1440,
          voices
        });
      }
      // Sort in memory to avoid firestore index requirement
      return episodes.sort((a, b) => a.number - b.number);
    } catch (error) {
      console.error('Error loading episodes:', error);
      return [];
    }
  }

  private async seedInitialData() {
    const initialAnime: Partial<Anime>[] = [
      {
        titleUa: 'Ван Піс',
        descriptionUa: 'Легендарна історія про пірата Монкі Д. Луффі та його команду, що шукають найбільший скарб у світі — Ван Піс.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg',
        rating: 9.8,
        year: 1999,
        episodesCount: 1100,
        status: 'ongoing',
        genres: ['Пригоди', 'Сьонен', 'Фентезі']
      },
      {
        titleUa: 'Бліч: Тисячолітня кривава війна',
        descriptionUa: 'Продовження історії Ічіґо Куросакі, який стикається з поверненням Квінсі — древнього ворога Женців Душ.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg',
        rating: 9.5,
        year: 2022,
        episodesCount: 52,
        status: 'ongoing',
        genres: ['Екшн', 'Надприродне', 'Сьонен']
      },
      {
        titleUa: 'Атака Титанів',
        descriptionUa: 'Сторіччя тому людство було майже винищене гігантськими гуманоїдними істотами, яких називають Титанами.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
        rating: 9.7,
        year: 2013,
        episodesCount: 88,
        status: 'completed',
        genres: ['Драма', 'Темне фентезі', 'Сьонен']
      },
      {
        titleUa: 'Наруто: Ураганні хроніки',
        descriptionUa: 'Минуло два з половиною роки з того часу, як Наруто Узумакі покинув Коноху для інтенсивних тренувань.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/5/17407.jpg',
        rating: 9.4,
        year: 2007,
        episodesCount: 500,
        status: 'completed',
        genres: ['Бойові мистецтва', 'Сьонен', 'Екшн']
      }
    ];

    const seededList: Anime[] = [];
    for (const data of initialAnime) {
      const docRef = await addDoc(collection(db, 'anime'), {
        ...data,
        createdAt: serverTimestamp()
      });
      
      const epRef = await addDoc(collection(db, `anime/${docRef.id}/episodes`), {
        number: 1,
        titleUa: 'Початок історії',
        durationSeconds: 1440,
        createdAt: serverTimestamp()
      });

      // Source 1: Direct File (Big Buck Bunny for testing)
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'Direct 1080p (Sample)',
        voiceType: 'official',
        fileUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      });

      // Source 2: AniHub Embed (UA Dub)
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'AniHub (UA)',
        voiceType: 'uk_dubbing',
        embedUrl: 'https://anihub.top/embed/1'
      });

      // Source 3: Anitube Embed
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'Anitube UA',
        voiceType: 'official',
        embedUrl: 'https://anitube.in.ua/player/example'
      });

      // Source 4: UAchan Embed
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'UAchan (Voice)',
        voiceType: 'fan_dub',
        embedUrl: 'https://uachan.net/embed/example'
      });

      // Source 5: BambooUA Embed
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'BambooUA (Player)',
        voiceType: 'fan_dub',
        embedUrl: 'https://bambooua.com/player/example'
      });

      seededList.push({ id: docRef.id, ...data } as Anime);
    }
    this.animeListSignal.set(seededList);
  }
}
