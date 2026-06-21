import type { FoldLine, Question } from '../data/questionBank';

export interface FoldState {
  foldedLines: Set<string>;
  currentStep: number;
}

export class OrigamiSVG {
  private svg: SVGSVGElement;
  private paperSize: number;
  private foldLines: FoldLine[];
  private onFold: (lineId: string) => void;
  private onUnfold: (lineId: string) => void;
  private paperGroup: SVGGElement;
  private foldStates: Map<string, boolean> = new Map();

  constructor(
    container: HTMLElement,
    question: Question,
    onFold: (lineId: string) => void,
    onUnfold: (lineId: string) => void
  ) {
    this.paperSize = question.paperSize;
    this.foldLines = question.foldLines;
    this.onFold = onFold;
    this.onUnfold = onUnfold;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.paperSize} ${this.paperSize + 50}`);
    this.svg.setAttribute('class', 'origami-svg');

    this.paperGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.paperGroup.setAttribute('class', 'paper-group');
    this.svg.appendChild(this.paperGroup);

    this.render();
    container.appendChild(this.svg);
  }

  private render(): void {
    this.paperGroup.innerHTML = '';

    const paper = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    paper.setAttribute('x', '0');
    paper.setAttribute('y', '0');
    paper.setAttribute('width', String(this.paperSize));
    paper.setAttribute('height', String(this.paperSize));
    paper.setAttribute('class', 'paper');
    this.paperGroup.appendChild(paper);

    const sortedLines = [...this.foldLines].sort((a, b) => a.order - b.order);

    sortedLines.forEach((line) => {
      const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      lineGroup.setAttribute('class', `fold-line ${line.type}`);
      lineGroup.setAttribute('data-line-id', line.id);

      const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLine.setAttribute('x1', String(line.x1));
      svgLine.setAttribute('y1', String(line.y1));
      svgLine.setAttribute('x2', String(line.x2));
      svgLine.setAttribute('y2', String(line.y2));
      svgLine.setAttribute('class', 'fold-line-path');
      lineGroup.appendChild(svgLine);

      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hitArea.setAttribute('x1', String(line.x1));
      hitArea.setAttribute('y1', String(line.y1));
      hitArea.setAttribute('x2', String(line.x2));
      hitArea.setAttribute('y2', String(line.y2));
      hitArea.setAttribute('class', 'fold-line-hit');
      hitArea.style.cursor = 'pointer';
      hitArea.addEventListener('click', () => this.toggleFold(line.id));
      lineGroup.appendChild(hitArea);

      const midX = (line.x1 + line.x2) / 2;
      const midY = (line.y1 + line.y2) / 2;

      const orderBadge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      orderBadge.setAttribute('class', 'order-badge');
      orderBadge.setAttribute('transform', `translate(${midX}, ${midY})`);

      const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badgeBg.setAttribute('r', '12');
      badgeBg.setAttribute('class', 'order-badge-bg');
      orderBadge.appendChild(badgeBg);

      const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('dominant-baseline', 'central');
      badgeText.setAttribute('class', 'order-badge-text');
      badgeText.textContent = String(line.order);
      orderBadge.appendChild(badgeText);

      lineGroup.appendChild(orderBadge);
      this.paperGroup.appendChild(lineGroup);

      this.foldStates.set(line.id, false);
    });

    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legend.setAttribute('class', 'legend');
    legend.setAttribute('transform', `translate(10, ${this.paperSize + 20})`);

    const valleyLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    valleyLine.setAttribute('x1', '0');
    valleyLine.setAttribute('y1', '0');
    valleyLine.setAttribute('x2', '30');
    valleyLine.setAttribute('y2', '0');
    valleyLine.setAttribute('class', 'legend-line valley');
    legend.appendChild(valleyLine);

    const valleyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valleyText.setAttribute('x', '35');
    valleyText.setAttribute('y', '4');
    valleyText.setAttribute('class', 'legend-text');
    valleyText.textContent = '谷折';
    legend.appendChild(valleyText);

    const mountainLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    mountainLine.setAttribute('x1', '80');
    mountainLine.setAttribute('y', '0');
    mountainLine.setAttribute('x2', '110');
    mountainLine.setAttribute('y2', '0');
    mountainLine.setAttribute('class', 'legend-line mountain');
    legend.appendChild(mountainLine);

    const mountainText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    mountainText.setAttribute('x', '115');
    mountainText.setAttribute('y', '4');
    mountainText.setAttribute('class', 'legend-text');
    mountainText.textContent = '山折';
    legend.appendChild(mountainText);

    this.svg.setAttribute('viewBox', `0 0 ${this.paperSize} ${this.paperSize + 50}`);
    this.svg.setAttribute('height', String(this.paperSize + 50));
    this.paperGroup.appendChild(legend);
  }

  private toggleFold(lineId: string): void {
    const isFolded = this.foldStates.get(lineId);
    if (isFolded) {
      this.unfoldLine(lineId);
    } else {
      this.foldLine(lineId);
    }
  }

  foldLine(lineId: string, notify = true): void {
    if (!this.foldStates.has(lineId)) return;

    this.foldStates.set(lineId, true);
    this.updateLineVisual(lineId, true);
    if (notify) {
      this.onFold(lineId);
    }
    this.updatePaperTransform();
  }

  unfoldLine(lineId: string, notify = true): void {
    if (!this.foldStates.has(lineId)) return;

    this.foldStates.set(lineId, false);
    this.updateLineVisual(lineId, false);
    if (notify) {
      this.onUnfold(lineId);
    }
    this.updatePaperTransform();
  }

  private updateLineVisual(lineId: string, folded: boolean): void {
    const lineGroup = this.paperGroup.querySelector(`[data-line-id="${lineId}"]`);
    if (lineGroup) {
      if (folded) {
        lineGroup.classList.add('folded');
      } else {
        lineGroup.classList.remove('folded');
      }
    }
  }

  private updatePaperTransform(): void {
    const paperRect = this.paperGroup.querySelector('.paper');
    if (paperRect) {
      const foldedCount = this.getFoldedCount();
      if (foldedCount === 0) {
        paperRect.removeAttribute('transform');
        paperRect.removeAttribute('transform-origin');
        return;
      }

      const scale = Math.max(0.68, 1 - foldedCount * 0.08);
      const offset = (this.paperSize * (1 - scale)) / 2;
      paperRect.setAttribute('transform-origin', `${this.paperSize / 2}px ${this.paperSize / 2}px`);
      paperRect.setAttribute('transform', `translate(${offset} ${offset}) scale(${scale})`);
    }
  }

  isFolded(lineId: string): boolean {
    return this.foldStates.get(lineId) || false;
  }

  getFoldedCount(): number {
    let count = 0;
    this.foldStates.forEach((folded) => {
      if (folded) count++;
    });
    return count;
  }

  reset(): void {
    this.foldLines.forEach(line => {
      this.foldStates.set(line.id, false);
      this.updateLineVisual(line.id, false);
    });
    const paperRect = this.paperGroup.querySelector('.paper');
    if (paperRect) {
      paperRect.removeAttribute('transform');
      paperRect.removeAttribute('transform-origin');
    }
  }

  destroy(): void {
    this.svg.remove();
  }
}
