import { Injectable, signal } from '@angular/core';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
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
        // Migration: Fix http links in existing data for Vercel
        this.animeListSignal.set(list);
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
      const epSnapshot = await getDocs(query(epCol, orderBy('number', 'asc')));
      
      const episodes: Episode[] = [];
      for (const epDoc of epSnapshot.docs) {
        const episodeData = epDoc.data();
        const voicesCol = collection(db, `anime/${animeId}/episodes/${epDoc.id}/voices`);
        const voicesSnapshot = await getDocs(voicesCol);
        const voices = voicesSnapshot.docs.map(vDoc => {
          const vData = vDoc.data();
          // Ensure HTTPS for Vercel
          let fileUrl = vData['fileUrl'] || '';
          if (fileUrl.startsWith('http://')) {
            fileUrl = fileUrl.replace('http://', 'https://');
          }
          // Fix specific broken w3schools link if it exists
          if (fileUrl.includes('w3schools.com/html/mov_bbb.mp4')) {
            fileUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          }
          
          return { id: vDoc.id, ...vData, fileUrl } as Voice;
        });
        
        episodes.push({
          id: epDoc.id,
          number: episodeData['number'],
          titleUa: episodeData['titleUa'] || `Серія ${episodeData['number']}`,
          durationSeconds: episodeData['durationSeconds'] || 1440,
          voices
        });
      }
      return episodes;
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
        posterUrl: 'https://images.alphacoders.com/133/1331000.png',
        rating: 9.8,
        year: 1999,
        episodesCount: 1100,
        status: 'ongoing',
        genres: ['Пригоди', 'Сьонен', 'Фентезі']
      },
      {
        titleUa: 'Бліч: Тисячолітня кривава війна',
        descriptionUa: 'Продовження історії Ічіґо Куросакі, який стикається з поверненням Квінсі — древнього ворога Женців Душ.',
        posterUrl: 'https://images2.alphacoders.com/128/1286125.jpg',
        rating: 9.5,
        year: 2022,
        episodesCount: 52,
        status: 'ongoing',
        genres: ['Екшн', 'Надприродне', 'Сьонен']
      },
      {
        titleUa: 'Магічна Битва',
        descriptionUa: 'Юджі Ітадорі ковтає палець могутнього прокляття і стає частиною світу магів, що борються з небезпечними істотами.',
        posterUrl: 'https://images6.alphacoders.com/131/1314619.jpg',
        rating: 9.2,
        year: 2020,
        episodesCount: 47,
        status: 'ongoing',
        genres: ['Екшн', 'Фентезі', 'Сьонен']
      }
    ];

    const seededList: Anime[] = [];
    for (const data of initialAnime) {
      const docRef = await addDoc(collection(db, 'anime'), {
        ...data,
        createdAt: serverTimestamp()
      });
      
      // Seed some episodes for all anime with working sample video
      const isOnePiece = data.titleUa === 'Ван Піс';
      const title = isOnePiece ? 'Я — Луффі! Людина, що стане Королем Піратів!' : 'Пробудження';
      // Use HTTPS only for Vercel compatibility
      const url = isOnePiece 
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
        : 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

      const epRef = await addDoc(collection(db, `anime/${docRef.id}/episodes`), {
        number: 1,
        titleUa: title,
        durationSeconds: 1440,
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, `anime/${docRef.id}/episodes/${epRef.id}/voices`), {
        voiceActor: 'FanVox UA',
        voiceType: 'uk_dubbing',
        fileUrl: url
      });

      seededList.push({ id: docRef.id, ...data } as Anime);
    }
    this.animeListSignal.set(seededList);
  }
}
