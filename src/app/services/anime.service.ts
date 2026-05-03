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
        rating: 9.8, year: 1999, episodesCount: 1100, status: 'ongoing', genres: ['Пригоди', 'Сьонен', 'Фентезі']
      },
      {
        titleUa: 'Бліч: ТКВ',
        descriptionUa: 'Продовження історії Ічіґо Куросакі, який стикається з поверненням Квінсі.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1764/126627.jpg',
        rating: 9.5, year: 2022, episodesCount: 52, status: 'ongoing', genres: ['Екшн', 'Надприродне']
      },
      {
        titleUa: 'Атака Титанів',
        descriptionUa: 'Боротьба людства проти велетенських гуманоїдних істот — Титанів.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
        rating: 9.7, year: 2013, episodesCount: 88, status: 'completed', genres: ['Драма', 'Темне фентезі']
      },
      {
        titleUa: 'Solo Leveling',
        descriptionUa: 'Найслабший мисливець стає найсильнішим у світі.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        rating: 9.6, year: 2024, episodesCount: 12, status: 'completed', genres: ['Екшн', 'Пригоди']
      },
      {
        titleUa: 'Магічна Битва',
        descriptionUa: 'Школяр стає маг-заклинателем, щоб боротися з прокляттями.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        rating: 9.3, year: 2020, episodesCount: 47, status: 'ongoing', genres: ['Екшн', 'Надприродне']
      },
      {
        titleUa: 'Людина-Бензопила',
        descriptionUa: 'Денджі укладає контракт з демоном і стає Людиною-Бензопилою.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
        rating: 9.2, year: 2022, episodesCount: 12, status: 'completed', genres: ['Екшн', 'Гор']
      },
      {
        titleUa: 'Сім’я Шпигуна',
        descriptionUa: 'Шпигун повинен завести сім’ю для секретної місії.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
        rating: 9.0, year: 2022, episodesCount: 37, status: 'ongoing', genres: ['Комедія', 'Екшн']
      },
      {
        titleUa: 'Клинок, що знищує демонів',
        descriptionUa: 'Танджіро стає мисливцем, щоб повернути людяність сестрі.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        rating: 9.4, year: 2019, episodesCount: 55, status: 'ongoing', genres: ['Екшн', 'Історичне']
      },
      {
        titleUa: 'Зоряне Дитя',
        descriptionUa: 'Темна сторона індустрії айдолів та шоу-бізнесу.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1812/134736.jpg',
        rating: 9.1, year: 2023, episodesCount: 24, status: 'ongoing', genres: ['Драма', 'Музика']
      },
      {
        titleUa: 'Фрірен',
        descriptionUa: 'Подорож ельфійки після закінчення легендарної пригоди.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1015/138052.jpg',
        rating: 9.9, year: 2023, episodesCount: 28, status: 'completed', genres: ['Пригоди', 'Фентезі']
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
        titleUa: 'Серія 1: Пробудження',
        durationSeconds: 1440,
        createdAt: serverTimestamp()
      });

      // Source 1: Anime4UA (Hikka)
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'Anime4UA (Hikka)',
        voiceType: 'uk_dubbing',
        embedUrl: 'https://anime4ua.com/embed/1'
      });

      // Source 2: AniHub
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'AniHub UA',
        voiceType: 'uk_dubbing',
        embedUrl: 'https://anihub.top/embed/1'
      });

      // Source 3: Anitube
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'Anitube',
        voiceType: 'official',
        embedUrl: 'https://anitube.in.ua/player/example'
      });

      // Source 4: UAchan
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'UAchan Team',
        voiceType: 'fan_dub',
        embedUrl: 'https://uachan.net/embed/example'
      });

      // Source 5: BambooUA
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'BambooUA Direct',
        voiceType: 'fan_dub',
        fileUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      });

      seededList.push({ id: docRef.id, ...data } as Anime);
    }
    this.animeListSignal.set(seededList);
  }
}
