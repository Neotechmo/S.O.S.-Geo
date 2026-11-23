import { Injectable, signal } from '@angular/core';

interface Notification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<Notification[]>([]);
  private nextId = 0;
  readonly notifications = this.items.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(id: number): void {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  private show(type: Notification['type'], message: string): void {
    const id = this.nextId++;
    this.items.update(items => [...items, { id, type, message }]);
  }
}
