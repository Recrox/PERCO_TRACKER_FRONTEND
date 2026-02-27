import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerceptorService } from '../../services/perceptor.service';
import { DOFUS_MAP_DATA } from '../../models/map.model';
import { Position } from '../../models/perceptor.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent {
  mapData = DOFUS_MAP_DATA;
  
  // Signals for UI state
  selectedPosition = signal<Position | null>(null);
  hoveredPosition = signal<Position | null>(null);
  viewportOffset = signal({ x: 0, y: 0 });
  zoom = signal(1);
  
  // Computed signal for grid cells
  gridCells = computed(() => {
    const cells: Position[] = [];
    for (let y = this.mapData.minY; y <= this.mapData.maxY; y++) {
      for (let x = this.mapData.minX; x <= this.mapData.maxX; x++) {
        cells.push({ x, y });
      }
    }
    return cells;
  });

  constructor(public perceptorService: PerceptorService) {}

  getGridWidth(): number {
    return this.mapData.maxX - this.mapData.minX + 1;
  }

  getGridHeight(): number {
    return this.mapData.maxY - this.mapData.minY + 1;
  }

  onCellClick(position: Position): void {
    const existingPerceptor = this.perceptorService.getPerceptorAt(position.x, position.y);
    
    if (existingPerceptor) {
      // Update last seen date if clicking on existing perceptor
      this.perceptorService.updatePerceptor(existingPerceptor.id, {
        lastSeenDate: new Date()
      });
      this.selectedPosition.set(position);
    } else {
      // Add new perceptor
      const now = new Date();
      this.perceptorService.addPerceptor({
        position,
        firstSeenDate: now,
        lastSeenDate: now
      });
      this.selectedPosition.set(position);
    }
  }

  onCellHover(position: Position): void {
    this.hoveredPosition.set(position);
  }

  onCellLeave(): void {
    this.hoveredPosition.set(null);
  }

  hasPerceptor(position: Position): boolean {
    return !!this.perceptorService.getPerceptorAt(position.x, position.y);
  }

  getPerceptorInfo(position: Position): string {
    const perceptor = this.perceptorService.getPerceptorAt(position.x, position.y);
    if (!perceptor) return '';
    
    const firstSeen = perceptor.firstSeenDate.toLocaleString();
    const lastSeen = perceptor.lastSeenDate.toLocaleString();
    return `First seen: ${firstSeen}\nLast seen: ${lastSeen}`;
  }

  deleteSelectedPerceptor(): void {
    const pos = this.selectedPosition();
    if (pos) {
      const perceptor = this.perceptorService.getPerceptorAt(pos.x, pos.y);
      if (perceptor) {
        this.perceptorService.deletePerceptor(perceptor.id);
        this.selectedPosition.set(null);
      }
    }
  }

  exportData(): void {
    const json = this.perceptorService.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dofus-perceptors-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          this.perceptorService.importFromJSON(event.target.result);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
