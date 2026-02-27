import { Component, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerceptorService } from '../../services/perceptor.service';
import { DOFUS_MAP_DATA } from '../../models/map.model';
import { Position, Perceptor } from '../../models/perceptor.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapCanvas', { static: false }) mapCanvas!: ElementRef<HTMLCanvasElement>;
  
  mapData = DOFUS_MAP_DATA;
  
  // Signals for UI state
  selectedPosition = signal<Position | null>(null);
  hoveredPosition = signal<Position | null>(null);
  zoom = signal(1);
  panOffset = signal({ x: 0, y: 0 });
  showEditModal = signal(false);
  editingPerceptor = signal<Perceptor | null>(null);
  editForm = signal({ guildName: '', guildBadge: '', notes: '' });
  
  // Map dimensions
  mapWidth = signal(0);
  mapHeight = signal(0);
  
  // Dragging state
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private lastPanOffset = { x: 0, y: 0 };
  
  // Image cache for guild badges
  private imageCache = new Map<string, HTMLImageElement>();
  
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

  ngAfterViewInit(): void {
    this.updateMapDimensions();
    this.drawMap();
    window.addEventListener('resize', () => this.onResize());
  }

  onResize(): void {
    this.updateMapDimensions();
    this.drawMap();
  }

  updateMapDimensions(): void {
    const container = this.mapCanvas.nativeElement.parentElement;
    if (container) {
      this.mapWidth.set(container.clientWidth);
      this.mapHeight.set(container.clientHeight - 100); // Reserve space for controls
      this.mapCanvas.nativeElement.width = this.mapWidth();
      this.mapCanvas.nativeElement.height = this.mapHeight();
    }
  }

  drawMap(): void {
    const canvas = this.mapCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    const zoom = this.zoom();
    const pan = this.panOffset();
    const cellSize = 20 * zoom;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = this.mapData.minX; x <= this.mapData.maxX; x++) {
      const pixelX = this.gameToPixel(x, 0).x + pan.x;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = this.mapData.minY; y <= this.mapData.maxY; y++) {
      const pixelY = this.gameToPixel(0, y).y + pan.y;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(canvas.width, pixelY);
      ctx.stroke();
    }

    // Draw coordinate labels (every 5 cells)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    for (let x = this.mapData.minX; x <= this.mapData.maxX; x += 5) {
      const pixelX = this.gameToPixel(x, 0).x + pan.x;
      ctx.fillText(x.toString(), pixelX, 15);
    }
    
    ctx.textAlign = 'right';
    for (let y = this.mapData.minY; y <= this.mapData.maxY; y += 5) {
      const pixelY = this.gameToPixel(0, y).y + pan.y;
      ctx.fillText(y.toString(), 25, pixelY + 4);
    }

    // Draw perceptors
    this.drawPerceptors(ctx);
  }

  drawPerceptors(ctx: CanvasRenderingContext2D): void {
    const perceptors = this.perceptorService.perceptors();
    const zoom = this.zoom();
    const pan = this.panOffset();
    const selected = this.selectedPosition();

    perceptors.forEach(perceptor => {
      const pixel = this.gameToPixel(perceptor.position.x, perceptor.position.y);
      const x = pixel.x + pan.x;
      const y = pixel.y + pan.y;
      const size = 15 * zoom;

      // Draw guild badge if present
      if (perceptor.guildBadge) {
        this.loadAndDrawBadge(ctx, perceptor.guildBadge, x - (12 * zoom), y - (12 * zoom), 24 * zoom);
      }

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw perceptor circle
      const isSelected = selected?.x === perceptor.position.x && selected?.y === perceptor.position.y;
      ctx.fillStyle = isSelected ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw icon (🏰)
      ctx.fillStyle = '#ffffff';
      ctx.font = `${12 * zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏰', x, y);

      // Draw guild name if present
      if (perceptor.guildName) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${10 * zoom}px sans-serif`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(perceptor.guildName, x, y - (size / 2) - (8 * zoom));
        ctx.fillText(perceptor.guildName, x, y - (size / 2) - (8 * zoom));
      }
    });
  }

  loadAndDrawBadge(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, size: number): void {
    if (!this.imageCache.has(url)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        this.drawMap();
      };
      img.onerror = () => {
        // If image fails to load, don't cache it
        console.warn('Failed to load guild badge:', url);
      };
      img.src = url;
    } else {
      const img = this.imageCache.get(url)!;
      // Draw white background circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw image
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    }
  }

  gameToPixel(x: number, y: number): { x: number; y: number } {
    const zoom = this.zoom();
    const cellSize = 20 * zoom;
    const offsetX = Math.abs(this.mapData.minX) * cellSize;
    const offsetY = Math.abs(this.mapData.minY) * cellSize;
    
    return {
      x: x * cellSize + offsetX,
      y: y * cellSize + offsetY
    };
  }

  pixelToGame(pixelX: number, pixelY: number): Position {
    const zoom = this.zoom();
    const pan = this.panOffset();
    const cellSize = 20 * zoom;
    const offsetX = Math.abs(this.mapData.minX) * cellSize;
    const offsetY = Math.abs(this.mapData.minY) * cellSize;
    
    const x = Math.round((pixelX - pan.x - offsetX) / cellSize);
    const y = Math.round((pixelY - pan.y - offsetY) / cellSize);
    
    return { x, y };
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.isDragging) return;
    
    const rect = this.mapCanvas.nativeElement.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const position = this.pixelToGame(pixelX, pixelY);
    
    // Check if position is within bounds
    if (position.x < this.mapData.minX || position.x > this.mapData.maxX ||
        position.y < this.mapData.minY || position.y > this.mapData.maxY) {
      return;
    }

    this.onCellClick(position);
  }

  onCanvasRightClick(event: MouseEvent): void {
    event.preventDefault(); // Prevent context menu
    if (this.isDragging) return;
    
    const rect = this.mapCanvas.nativeElement.getBoundingClientRect();
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;
    const position = this.pixelToGame(pixelX, pixelY);
    
    // Check if position is within bounds
    if (position.x < this.mapData.minX || position.x > this.mapData.maxX ||
        position.y < this.mapData.minY || position.y > this.mapData.maxY) {
      return;
    }

    this.onCellRightClick(position);
  }

  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.lastPanOffset = { ...this.panOffset() };
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      this.panOffset.set({
        x: this.lastPanOffset.x + dx,
        y: this.lastPanOffset.y + dy
      });
      this.drawMap();
    } else {
      // Update hovered position
      const rect = this.mapCanvas.nativeElement.getBoundingClientRect();
      const pixelX = event.clientX - rect.left;
      const pixelY = event.clientY - rect.top;
      const position = this.pixelToGame(pixelX, pixelY);
      
      if (position.x >= this.mapData.minX && position.x <= this.mapData.maxX &&
          position.y >= this.mapData.minY && position.y <= this.mapData.maxY) {
        this.hoveredPosition.set(position);
      }
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, this.zoom() * delta));
    this.zoom.set(newZoom);
    this.drawMap();
  }

  resetView(): void {
    this.zoom.set(1);
    this.panOffset.set({ x: 0, y: 0 });
    this.drawMap();
  }

  zoomIn(): void {
    const newZoom = Math.min(3, this.zoom() * 1.2);
    this.zoom.set(newZoom);
    this.drawMap();
  }

  zoomOut(): void {
    const newZoom = Math.max(0.5, this.zoom() / 1.2);
    this.zoom.set(newZoom);
    this.drawMap();
  }

  onCellClick(position: Position): void {
    const existingPerceptor = this.perceptorService.getPerceptorAt(position.x, position.y);
    
    if (existingPerceptor) {
      // Update last seen date for existing perceptor
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
    this.drawMap();
  }

  onCellRightClick(position: Position): void {
    const existingPerceptor = this.perceptorService.getPerceptorAt(position.x, position.y);
    
    if (existingPerceptor) {
      // Open edit modal for existing perceptor
      this.editingPerceptor.set(existingPerceptor);
      this.editForm.set({
        guildName: existingPerceptor.guildName || '',
        guildBadge: existingPerceptor.guildBadge || '',
        notes: existingPerceptor.notes || ''
      });
      this.showEditModal.set(true);
      this.selectedPosition.set(position);
    }
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
        this.drawMap();
      }
    }
  }

  editSelectedPerceptor(): void {
    const pos = this.selectedPosition();
    if (pos) {
      this.onCellRightClick(pos);
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
          this.drawMap();
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  closeModal(): void {
    this.showEditModal.set(false);
    this.editingPerceptor.set(null);
  }

  savePerceptor(): void {
    const perceptor = this.editingPerceptor();
    if (!perceptor) return;

    const form = this.editForm();
    this.perceptorService.updatePerceptor(perceptor.id, {
      guildName: form.guildName || undefined,
      guildBadge: form.guildBadge || undefined,
      notes: form.notes || undefined,
      lastSeenDate: new Date()
    });

    this.closeModal();
    this.drawMap();
  }

  updateFormField(field: 'guildName' | 'guildBadge' | 'notes', value: string): void {
    const current = this.editForm();
    this.editForm.set({ ...current, [field]: value });
  }
}
