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
        titleUa: 'Магічна Битва',
        descriptionUa: 'У світі, де прокляття живляться людськими емоціями, старшокласник Юдзі Ітадорі поглинає могутній артефакт, щоб врятувати друзів, і стає частиною небезпечного світу магічних битв.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        rating: 9.3, year: 2020, episodesCount: 47, status: 'ongoing', genres: ['Екшн', 'Надприродне', 'Фентезі']
      },
      {
        titleUa: 'Людина-Бензопила',
        descriptionUa: 'Денджі — бідний хлопець, який полює на демонів. Після зради він укладає контракт зі своїм демонічним псом Почітою і перетворюється на гібрида людини та бензопили.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg',
        rating: 9.2, year: 2022, episodesCount: 12, status: 'completed', genres: ['Екшн', 'Демони', 'Горрор']
      },
      {
        titleUa: 'Атака Титанів',
        descriptionUa: 'Людство живе за трьома кільцями стін, щоб захиститися від людиноподібних гігантів. Ерен Єгер присягається знищити всіх титанів після руйнування його рідного міста.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
        rating: 9.7, year: 2013, episodesCount: 88, status: 'completed', genres: ['Драма', 'Темне фентезі', 'Екшн']
      },
      {
        titleUa: 'Підняття рівня поодинці',
        descriptionUa: 'Найслабший мисливець людства отримує унікальну систему, яка дозволяє йому "піднімати рівень" без обмежень у небезпечному світі підземель.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        rating: 9.6, year: 2024, episodesCount: 12, status: 'completed', genres: ['Екшн', 'Пригоди', 'Фентезі']
      },
      {
        titleUa: 'Дитина Ідола',
        descriptionUa: 'Лікар Амемія Горо перевтілюється в одного з дітей легендарного ідола Хошіно Ай і занурюється у жорстокий та емоційний світ шоу-бізнесу.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1812/134736.jpg',
        rating: 9.1, year: 2023, episodesCount: 24, status: 'ongoing', genres: ['Драма', 'Музика', 'Детектив']
      },
      {
        titleUa: 'Фрірен: Після кінця подорожі',
        descriptionUa: 'Подорож безсмертної ельфійки після завершення десятирічної пригоди, яка змінила світ. Роздуми про час, дружбу та шлях героїв.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1015/138052.jpg',
        rating: 9.9, year: 2023, episodesCount: 28, status: 'completed', genres: ['Пригоди', 'Фентезі', 'Сейнен']
      },
      {
        titleUa: 'Сага про Вінланд',
        descriptionUa: 'Юний Торфінн прагне помститися вбивці свого батька на тлі кривавої боротьби вікінгів за владу в Англії XI століття.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg',
        rating: 9.3, year: 2019, episodesCount: 48, status: 'completed', genres: ['Історичне', 'Драма', 'Сейнен']
      },
      {
        titleUa: 'Сім’я Шпигуна',
        descriptionUa: 'Шпигун отримує завдання створити фальшиву сім’ю, не знаючи, що його дружина — кілер, а донька — телепат. Комбо екшну та комедії.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1441/122795.jpg',
        rating: 9.0, year: 2022, episodesCount: 37, status: 'ongoing', genres: ['Комедія', 'Екшн', 'Повсякденність']
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
