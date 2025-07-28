import * as fabric from 'fabric';

interface CanvasState {
  data: string;
  timestamp: number;
}

export class CanvasHistoryManager {
  private history: CanvasState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private canvas: fabric.Canvas;
  private isRedoing: boolean = false;
  private isUndoing: boolean = false;
  private isLoading: boolean = false;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.setupEventListeners();
    // Save initial state after a short delay to ensure canvas is ready
    setTimeout(() => this.saveState(), 100);
  }

  private setupEventListeners() {
    // Debounce to avoid saving state too frequently
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (!this.isRedoing && !this.isUndoing && !this.isLoading) {
          this.saveState();
        }
      }, 300);
    };

    this.canvas.on('object:added', debouncedSave);
    this.canvas.on('object:removed', debouncedSave);
    this.canvas.on('object:modified', debouncedSave);
    this.canvas.on('path:created', debouncedSave);
  }

  saveState() {
    try {
      if (this.isRedoing || this.isUndoing || this.isLoading) return;

      // Filter out grid lines and system objects
      const objects = this.canvas.getObjects().filter(obj => {
        const fabricObj = obj as any;
        return !fabricObj.excludeFromExport && 
               obj.stroke !== '#F1F5F9' && 
               obj.stroke !== '#CBD5E1';
      });

      const stateData = JSON.stringify({
        objects: objects.map(obj => obj.toObject(['id', 'excludeFromExport'])),
        backgroundImage: this.canvas.backgroundImage,
        backgroundColor: this.canvas.backgroundColor
      });
      
      // Remove future history if we're not at the end
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      // Add new state
      this.history.push({
        data: stateData,
        timestamp: Date.now(),
      });

      this.currentIndex++;

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.currentIndex--;
      }

      console.log(`💾 State saved (${this.currentIndex + 1}/${this.history.length})`);
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  undo(): boolean {
    if (this.canUndo()) {
      this.isUndoing = true;
      this.currentIndex--;
      this.loadState(this.history[this.currentIndex].data);
      console.log(`↶ Undo (${this.currentIndex + 1}/${this.history.length})`);
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.canRedo()) {
      this.isRedoing = true;
      this.currentIndex++;
      this.loadState(this.history[this.currentIndex].data);
      console.log(`↷ Redo (${this.currentIndex + 1}/${this.history.length})`);
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  private loadState(stateData: string) {
    try {
      this.isLoading = true;
      const data = JSON.parse(stateData);
      
      // Clear only user objects, preserve grid
      const allObjects = this.canvas.getObjects();
      const userObjects = allObjects.filter(obj => {
        const fabricObj = obj as any;
        return !fabricObj.excludeFromExport && 
               obj.stroke !== '#F1F5F9' && 
               obj.stroke !== '#CBD5E1';
      });
      
      userObjects.forEach(obj => this.canvas.remove(obj));

      // Restore objects
      if (data.objects && Array.isArray(data.objects)) {
        data.objects.forEach((objData: any) => {
          fabric.util.enlivenObjects([objData]).then((objects: any[]) => {
            if (objects[0]) {
              this.canvas.add(objects[0]);
            }
          }).catch(console.error);
        });
      }

      // Restore background
      if (data.backgroundColor) {
        this.canvas.backgroundColor = data.backgroundColor;
      }

      setTimeout(() => {
        this.canvas.renderAll();
        this.isUndoing = false;
        this.isRedoing = false;
        this.isLoading = false;
      }, 50);
      
    } catch (error) {
      console.error('Failed to load state:', error);
      this.isUndoing = false;
      this.isRedoing = false;
      this.isLoading = false;
    }
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.saveState();
  }
}

export class CanvasExporter {
  private canvas: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  exportToPNG(filename: string = 'diagram.png', quality: number = 1): void {
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: quality,
      multiplier: 2, // Higher resolution
    });
    
    this.downloadFile(dataURL, filename);
  }

  exportToJPEG(filename: string = 'diagram.jpg', quality: number = 0.8): void {
    const dataURL = this.canvas.toDataURL({
      format: 'jpeg',
      quality: quality,
      multiplier: 2,
    });
    
    this.downloadFile(dataURL, filename);
  }

  exportToSVG(filename: string = 'diagram.svg'): void {
    const svgString = this.canvas.toSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, filename);
  }

  exportToJSON(filename: string = 'diagram.json'): void {
    const jsonString = JSON.stringify(this.canvas.toJSON(['id']), null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, filename);
  }

  async exportToPDF(filename: string = 'diagram.pdf'): Promise<void> {
    try {
      // Dynamic import to avoid bundle size issues
      const { jsPDF } = await import('jspdf');
      
      const canvas = this.canvas;
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the page
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = pageWidth - 20; // 10mm margin on each side
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20;
        imgWidth = imgHeight * aspectRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try PNG export instead.');
    }
  }

  private downloadFile(dataURL: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getCanvasPreview(width: number = 200, height: number = 150): string {
    return this.canvas.toDataURL({
      format: 'png',
      quality: 0.7,
      width: width,
      height: height,
    });
  }
}

export class CanvasClipboard {
  private canvas: fabric.Canvas;
  private clipboardData: any[] = [];

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  copy(): boolean {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      // Handle multiple selection
      if (activeObject.type === 'activeSelection') {
        const activeSelection = activeObject as fabric.ActiveSelection;
        this.clipboardData = activeSelection.getObjects().map(obj => 
          obj.toObject(['id', 'excludeFromExport'])
        );
        console.log(`📋 Copied ${this.clipboardData.length} objects`);
      } else {
        // Single object
        this.clipboardData = [activeObject.toObject(['id', 'excludeFromExport'])];
        console.log(`📋 Copied 1 object`);
      }
      return true;
    }
    return false;
  }

  async paste(offsetX: number = 20, offsetY: number = 20): Promise<boolean> {
    if (this.clipboardData.length === 0) return false;

    try {
      const pastedObjects: fabric.FabricObject[] = [];
      
      // Process all objects
      for (const data of this.clipboardData) {
        const fabricObject = await this.createFabricObjectFromData(data);
        
        // Offset the pasted object
        fabricObject.set({
          left: (fabricObject.left || 0) + offsetX,
          top: (fabricObject.top || 0) + offsetY,
        });

        this.canvas.add(fabricObject);
        pastedObjects.push(fabricObject);
      }

      // Select pasted objects
      if (pastedObjects.length === 1) {
        this.canvas.setActiveObject(pastedObjects[0]);
      } else if (pastedObjects.length > 1) {
        const selection = new fabric.ActiveSelection(pastedObjects, {
          canvas: this.canvas,
        });
        this.canvas.setActiveObject(selection);
      }

      this.canvas.renderAll();
      console.log(`📋 Pasted ${pastedObjects.length} objects`);
      return true;
    } catch (error) {
      console.error('Paste failed:', error);
      return false;
    }
  }

  private async createFabricObjectFromData(data: any): Promise<fabric.FabricObject> {
    return new Promise((resolve, reject) => {
      try {
        fabric.util.enlivenObjects([data]).then((objects: any[]) => {
          if (objects && objects.length > 0) {
            resolve(objects[0]);
          } else {
            reject(new Error('Failed to create object from clipboard data'));
          }
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  cut(): boolean {
    if (this.copy()) {
      const activeObject = this.canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'activeSelection') {
          // Multiple objects
          const activeSelection = activeObject as fabric.ActiveSelection;
          const objects = activeSelection.getObjects();
          objects.forEach(obj => this.canvas.remove(obj));
          console.log(`✂️ Cut ${objects.length} objects`);
        } else {
          // Single object
          this.canvas.remove(activeObject);
          console.log(`✂️ Cut 1 object`);
        }
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        return true;
      }
    }
    return false;
  }

  async duplicate(): Promise<boolean> {
    if (this.copy()) {
      return await this.paste(30, 30); // Larger offset for duplication
    }
    return false;
  }

  hasClipboardData(): boolean {
    return this.clipboardData.length > 0;
  }

  clear(): void {
    this.clipboardData = [];
  }
}

export class CanvasAlignment {
  private canvas: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  alignLeft(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const leftmost = Math.min(...targets.map(obj => obj.left || 0));
    targets.forEach(obj => obj.set({ left: leftmost }));
    this.canvas.renderAll();
  }

  alignRight(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const rightmost = Math.max(...targets.map(obj => (obj.left || 0) + (obj.width || 0)));
    targets.forEach(obj => obj.set({ left: rightmost - (obj.width || 0) }));
    this.canvas.renderAll();
  }

  alignTop(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const topmost = Math.min(...targets.map(obj => obj.top || 0));
    targets.forEach(obj => obj.set({ top: topmost }));
    this.canvas.renderAll();
  }

  alignBottom(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const bottommost = Math.max(...targets.map(obj => (obj.top || 0) + (obj.height || 0)));
    targets.forEach(obj => obj.set({ top: bottommost - (obj.height || 0) }));
    this.canvas.renderAll();
  }

  alignCenterHorizontal(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const canvasCenter = this.canvas.width! / 2;
    targets.forEach(obj => {
      const objCenter = canvasCenter - (obj.width || 0) / 2;
      obj.set({ left: objCenter });
    });
    this.canvas.renderAll();
  }

  alignCenterVertical(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 2) return;

    const canvasCenter = this.canvas.height! / 2;
    targets.forEach(obj => {
      const objCenter = canvasCenter - (obj.height || 0) / 2;
      obj.set({ top: objCenter });
    });
    this.canvas.renderAll();
  }

  distributeHorizontal(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 3) return;

    targets.sort((a, b) => (a.left || 0) - (b.left || 0));
    const totalWidth = targets[targets.length - 1].left! - targets[0].left!;
    const spacing = totalWidth / (targets.length - 1);

    targets.forEach((obj, index) => {
      if (index > 0 && index < targets.length - 1) {
        obj.set({ left: targets[0].left! + spacing * index });
      }
    });
    this.canvas.renderAll();
  }

  distributeVertical(objects?: fabric.FabricObject[]): void {
    const targets = objects || this.getSelectedObjects();
    if (targets.length < 3) return;

    targets.sort((a, b) => (a.top || 0) - (b.top || 0));
    const totalHeight = targets[targets.length - 1].top! - targets[0].top!;
    const spacing = totalHeight / (targets.length - 1);

    targets.forEach((obj, index) => {
      if (index > 0 && index < targets.length - 1) {
        obj.set({ top: targets[0].top! + spacing * index });
      }
    });
    this.canvas.renderAll();
  }

  private getSelectedObjects(): fabric.FabricObject[] {
    const activeSelection = this.canvas.getActiveObject();
    if (activeSelection && activeSelection.type === 'activeSelection') {
      return (activeSelection as any).getObjects();
    }
    return activeSelection ? [activeSelection] : [];
  }
}

// Zoom utilities
export class CanvasZoom {
  private canvas: fabric.Canvas;
  private minZoom: number = 0.1;
  private maxZoom: number = 5;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.setupZoomEvents();
  }

  private setupZoomEvents() {
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      this.setZoom(zoom, opt.e.offsetX, opt.e.offsetY);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  setZoom(zoom: number, x?: number, y?: number): void {
    zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    
    if (x !== undefined && y !== undefined) {
      this.canvas.zoomToPoint({ x, y }, zoom);
    } else {
      this.canvas.setZoom(zoom);
    }
    
    this.canvas.renderAll();
  }

  zoomIn(factor: number = 1.2): void {
    const center = this.canvas.getCenter();
    this.setZoom(this.canvas.getZoom() * factor, center.left, center.top);
  }

  zoomOut(factor: number = 0.8): void {
    const center = this.canvas.getCenter();
    this.setZoom(this.canvas.getZoom() * factor, center.left, center.top);
  }

  zoomToFit(): void {
    const objects = this.canvas.getObjects().filter(obj => !(obj as any).excludeFromExport);
    if (objects.length === 0) return;

    const group = new fabric.Group(objects, { canvas: this.canvas });
    const groupBounds = group.getBoundingRect();
    
    const canvasWidth = this.canvas.width!;
    const canvasHeight = this.canvas.height!;
    
    const scaleX = (canvasWidth * 0.8) / groupBounds.width;
    const scaleY = (canvasHeight * 0.8) / groupBounds.height;
    const scale = Math.min(scaleX, scaleY);
    
    this.setZoom(scale);
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const groupCenterX = groupBounds.left + groupBounds.width / 2;
    const groupCenterY = groupBounds.top + groupBounds.height / 2;
    
    this.canvas.relativePan({
      x: centerX - groupCenterX * scale,
      y: centerY - groupCenterY * scale,
    });
  }

  resetZoom(): void {
    this.canvas.setZoom(1);
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.canvas.renderAll();
  }

  getZoomLevel(): number {
    return Math.round(this.canvas.getZoom() * 100);
  }
} 