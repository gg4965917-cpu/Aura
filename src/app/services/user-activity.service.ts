import { Injectable, signal, inject, computed, effect } from '@angular/core';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { UserService } from './user.service';

export interface WatchlistItem {
  id: string;
  animeId: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityService {
  private userService = inject(UserService);
  private unsubscribe: Unsubscribe | null = null;
  
  watchlist = signal<WatchlistItem[]>([]);
  
  constructor() {
    effect(() => {
      const user = this.userService.currentUser();
      if (user) {
        this.startWatchlistListener(user.uid);
      } else {
        this.stopListener();
        this.watchlist.set([]);
      }
    });
  }

  private startWatchlistListener(userId: string) {
    this.stopListener();
    const q = collection(db, `users/${userId}/watchlist`);
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchlistItem));
      this.watchlist.set(items);
    }, (error) => {
      console.error('Watchlist listener error:', error);
    });
  }

  private stopListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  isInWatchlist(animeId: string) {
    return computed(() => this.watchlist().some(item => item.animeId === animeId));
  }

  async toggleWatchlist(animeId: string) {
    const user = this.userService.currentUser();
    if (!user) {
      this.userService.login();
      return;
    }

    const currentItem = this.watchlist().find(item => item.animeId === animeId);
    const watchlistRef = collection(db, `users/${user.uid}/watchlist`);

    if (currentItem) {
      await deleteDoc(doc(db, `users/${user.uid}/watchlist`, currentItem.id));
    } else {
      await setDoc(doc(watchlistRef, animeId), {
        animeId,
        addedAt: serverTimestamp()
      });
    }
  }
}
