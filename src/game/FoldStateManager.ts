import type { Question, FoldLine } from '../data/questionBank';

export class FoldStateManager {
  private question: Question;
  private foldedLines: Map<string, number> = new Map();
  private foldOrder: string[] = [];
  private currentStep: number = 0;

  constructor(question: Question) {
    this.question = question;
  }

  canFold(lineId: string): boolean {
    if (this.foldedLines.has(lineId)) return false;
    if (this.currentStep >= this.question.maxSteps) return false;

    const line = this.question.foldLines.find(l => l.id === lineId);
    if (!line) return false;

    return line.order === this.currentStep + 1;
  }

  fold(lineId: string): boolean {
    if (!this.canFold(lineId)) return false;

    this.foldedLines.set(lineId, this.foldOrder.length + 1);
    this.foldOrder.push(lineId);
    this.currentStep++;
    return true;
  }

  canUnfold(lineId: string): boolean {
    if (!this.foldedLines.has(lineId)) return false;
    const lastFolded = this.foldOrder[this.foldOrder.length - 1];
    return lastFolded === lineId;
  }

  unfold(lineId: string): boolean {
    if (!this.canUnfold(lineId)) return false;

    this.foldedLines.delete(lineId);
    this.foldOrder.pop();
    this.currentStep--;
    return true;
  }

  isFolded(lineId: string): boolean {
    return this.foldedLines.has(lineId);
  }

  getFoldOrder(lineId: string): number | undefined {
    return this.foldedLines.get(lineId);
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getMaxSteps(): number {
    return this.question.maxSteps;
  }

  getFoldLines(): FoldLine[] {
    return this.question.foldLines;
  }

  getNextFoldLine(): FoldLine | null {
    return this.question.foldLines.find(line => line.order === this.currentStep + 1) ?? null;
  }

  isComplete(): boolean {
    return this.question.foldLines.every(line => this.foldedLines.has(line.id));
  }

  getFoldedLineIds(): string[] {
    return [...this.foldOrder];
  }

  reset(): void {
    this.foldedLines.clear();
    this.foldOrder = [];
    this.currentStep = 0;
  }

  getQuestion(): Question {
    return this.question;
  }
}
