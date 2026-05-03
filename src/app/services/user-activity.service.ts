import { Injectable, signal, inject, computed } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  where
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
  
  watchlist = signal<WatchlistItem[]>([]);
  
  constructor() {
    this.initWatchlistListener();
  }

  private initWatchlistListener() {
    // Listen for changes in user's watchlist
    const user = this.userService.currentUser();
    if (user) {
      const q = collection(db, `users/${user.uid}/watchlist`);
      onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchlistItem));
        this.watchlist.set(items);
      });
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
