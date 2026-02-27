import { Injectable, signal } from '@angular/core';
import { Perceptor } from '../models/perceptor.model';

@Injectable({
  providedIn: 'root'
})
export class PerceptorService {
  private readonly STORAGE_KEY = 'dofus-perceptors';
  
  // Signal to track perceptors
  perceptors = signal<Perceptor[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        const perceptors = data.map((p: any) => ({
          ...p,
          firstSeenDate: new Date(p.firstSeenDate),
          lastSeenDate: new Date(p.lastSeenDate)
        }));
        this.perceptors.set(perceptors);
      } catch (error) {
        console.error('Error loading perceptors from storage:', error);
      }
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.perceptors()));
    } catch (error) {
      console.error('Error saving perceptors to storage:', error);
    }
  }

  addPerceptor(perceptor: Omit<Perceptor, 'id'>): void {
    const newPerceptor: Perceptor = {
      ...perceptor,
      id: crypto.randomUUID()
    };
    this.perceptors.update(perceptors => [...perceptors, newPerceptor]);
    this.saveToStorage();
  }

  updatePerceptor(id: string, updates: Partial<Omit<Perceptor, 'id'>>): void {
    this.perceptors.update(perceptors =>
      perceptors.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    this.saveToStorage();
  }

  deletePerceptor(id: string): void {
    this.perceptors.update(perceptors => perceptors.filter(p => p.id !== id));
    this.saveToStorage();
  }

  getPerceptorAt(x: number, y: number): Perceptor | undefined {
    return this.perceptors().find(p => p.position.x === x && p.position.y === y);
  }

  exportToJSON(): string {
    return JSON.stringify(this.perceptors(), null, 2);
  }

  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json);
      const perceptors = data.map((p: any) => ({
        ...p,
        firstSeenDate: new Date(p.firstSeenDate),
        lastSeenDate: new Date(p.lastSeenDate)
      }));
      this.perceptors.set(perceptors);
      this.saveToStorage();
    } catch (error) {
      console.error('Error importing perceptors:', error);
      throw new Error('Invalid JSON format');
    }
  }

  clearAll(): void {
    this.perceptors.set([]);
    this.saveToStorage();
  }
}
