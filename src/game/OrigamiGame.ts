import { questionBank, modelDescriptions, type Question } from '../data/questionBank';
import { SeededRandom, generateSeed } from '../utils/random';
import { OrigamiSVG } from '../components/OrigamiSVG';
import { Model3DViewer } from '../components/Model3DViewer';
import { FoldStateManager } from './FoldStateManager';

export interface GameState {
  currentQuestion: Question | null;
  score: number;
  level: number;
  stepsUsed: number;
  selectedModelId: string | null;
  gameStatus: 'idle' | 'playing' | 'won' | 'lost';
  paused: boolean;
}

export class OrigamiGame {
  private container: HTMLElement;
  private state: GameState;
  private seed: number;
  private rng: SeededRandom;
  private questionPool: Question[] = [];
  private currentQuestionIndex: number = 0;
  private origamiSVG: OrigamiSVG | null = null;
  private foldStateManager: FoldStateManager | null = null;
  private modelViewers: Model3DViewer[] = [];
  private shuffledOptions: string[] = [];

  private modelsContainer: HTMLElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private resetBtn: HTMLButtonElement | null = null;
  private hintBtn: HTMLButtonElement | null = null;
  private nextBtn: HTMLButtonElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private pauseOverlay: HTMLElement | null = null;
  private gameMain: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      currentQuestion: null,
      score: 0,
      level: 1,
      stepsUsed: 0,
      selectedModelId: null,
      gameStatus: 'idle',
      paused: false
    };
    this.seed = generateSeed();
    this.rng = new SeededRandom(this.seed);
    this.questionPool = this.rng.shuffle([...questionBank]);

    this.initUI();
    this.startGame();
  }

  private initUI(): void {
    this.container.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <h1>🎯 3D 折纸挑战</h1>
          <div class="game-stats">
            <span class="stat-item">
              <span class="stat-label">关卡</span>
              <span class="stat-value" id="level-display">1</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">得分</span>
              <span class="stat-value" id="score-display">0</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">步数</span>
              <span class="stat-value" id="steps-display">0/0</span>
            </span>
            <button class="btn btn-pause" id="pause-btn">⏸️ 暂停</button>
          </div>
        </div>

        <div class="game-main" id="game-main">
          <div class="left-panel">
            <div class="panel-title">📐 折痕图</div>
            <div class="question-info" id="question-info">
              <h2 id="question-name">题目名称</h2>
              <p id="question-desc">题目描述</p>
            </div>
            <div class="svg-container" id="svg-container"></div>
            <div class="action-buttons">
              <button class="btn btn-secondary" id="reset-btn">🔄 重置</button>
              <button class="btn btn-secondary" id="hint-btn">💡 提示</button>
            </div>
          </div>

          <div class="right-panel">
            <div class="panel-title">🧩 选择正确的3D模型</div>
            <div class="models-container" id="models-container"></div>
            <div class="submit-area">
              <button class="btn btn-primary" id="submit-btn" disabled>✅ 提交答案</button>
            </div>
          </div>
        </div>

        <div class="game-footer">
          <button class="btn btn-next" id="next-btn" style="display: none;">➡️ 下一题</button>
          <div class="result-message" id="result-message"></div>
        </div>

        <div class="pause-overlay" id="pause-overlay" style="display: none;">
          <div class="pause-content">
            <div class="pause-icon">🔒</div>
            <h2 class="pause-title">游戏已暂停</h2>
            <div class="pause-score">
              <span class="pause-score-label">当前得分</span>
              <span class="pause-score-value" id="pause-score-value">0</span>
            </div>
            <button class="btn btn-primary btn-resume" id="resume-btn">▶️ 继续游戏</button>
            <p class="pause-hint">点击继续后将恢复暂停前的状态</p>
          </div>
        </div>
      </div>
    `;

    this.modelsContainer = this.container.querySelector('#models-container');
    this.submitBtn = this.container.querySelector('#submit-btn');
    this.resetBtn = this.container.querySelector('#reset-btn');
    this.hintBtn = this.container.querySelector('#hint-btn');
    this.nextBtn = this.container.querySelector('#next-btn');
    this.pauseBtn = this.container.querySelector('#pause-btn');
    this.pauseOverlay = this.container.querySelector('#pause-overlay');
    this.gameMain = this.container.querySelector('#game-main');

    this.submitBtn?.addEventListener('click', () => this.checkAnswer());
    this.resetBtn?.addEventListener('click', () => this.resetFolds());
    this.hintBtn?.addEventListener('click', () => this.showHint());
    this.nextBtn?.addEventListener('click', () => this.nextQuestion());
    this.pauseBtn?.addEventListener('click', () => this.pauseGame());
    this.container.querySelector('#resume-btn')?.addEventListener('click', () => this.resumeGame());
  }

  private startGame(): void {
    this.loadQuestion(this.currentQuestionIndex);
  }

  private loadQuestion(index: number): void {
    let safeIndex = index;
    if (index >= this.questionPool.length) {
      this.currentQuestionIndex = 0;
      this.questionPool = this.rng.shuffle([...questionBank]);
      safeIndex = 0;
    }

    const question = this.questionPool[safeIndex];
    this.state.currentQuestion = question;
    this.state.stepsUsed = 0;
    this.state.selectedModelId = null;
    this.state.gameStatus = 'playing';

    this.updateUI();
    this.setupOrigamiSVG(question);
    this.setupFoldState(question);
    this.setupModelOptions(question);
    this.hideMessage();
    this.updateSubmitState();

    if (this.nextBtn) {
      this.nextBtn.style.display = 'none';
    }
  }

  private setupOrigamiSVG(question: Question): void {
    const svgContainer = this.container.querySelector('#svg-container') as HTMLElement;
    if (!svgContainer) return;

    if (this.origamiSVG) {
      this.origamiSVG.destroy();
    }

    this.origamiSVG = new OrigamiSVG(
      svgContainer,
      question,
      (lineId) => this.handleFold(lineId),
      (lineId) => this.handleUnfold(lineId)
    );
  }

  private setupFoldState(question: Question): void {
    this.foldStateManager = new FoldStateManager(question);
  }

  private setupModelOptions(question: Question): void {
    this.modelViewers.forEach(viewer => viewer.destroy());
    this.modelViewers = [];

    const options = [question.correctModelId, ...question.distractorModelIds];
    this.shuffledOptions = this.rng.shuffle(options);

    if (this.modelsContainer) {
      this.modelsContainer.innerHTML = '';
    }

    this.shuffledOptions.forEach((modelId) => {
      const modelCard = document.createElement('div');
      modelCard.className = 'model-card';
      modelCard.dataset.modelId = modelId;

      const modelViewerContainer = document.createElement('div');
      modelViewerContainer.className = 'model-viewer';
      modelCard.appendChild(modelViewerContainer);

      const modelLabel = document.createElement('div');
      modelLabel.className = 'model-label';
      const desc = modelDescriptions[modelId];
      modelLabel.textContent = desc ? desc.name : modelId;
      modelCard.appendChild(modelLabel);

      modelCard.addEventListener('click', () => this.selectModel(modelId));

      this.modelsContainer?.appendChild(modelCard);

      const viewer = new Model3DViewer(modelViewerContainer);
      viewer.loadModel(modelId);
      this.modelViewers.push(viewer);
    });
  }

  private handleFold(lineId: string): void {
    if (!this.foldStateManager || this.state.gameStatus !== 'playing' || this.state.paused) return;

    if (this.foldStateManager.fold(lineId)) {
      this.state.stepsUsed = this.foldStateManager.getCurrentStep();
      this.updateStepsDisplay();
      this.checkFoldComplete();
    } else {
      this.origamiSVG?.unfoldLine(lineId, false);
      const nextLine = this.foldStateManager.getNextFoldLine();
      if (nextLine) {
        this.showMessage(`请按顺序折叠：第 ${nextLine.order} 步 - ${this.formatFoldType(nextLine.type)}`, 'info');
      }
    }
    this.updateSubmitState();
  }

  private handleUnfold(lineId: string): void {
    if (!this.foldStateManager || this.state.gameStatus !== 'playing' || this.state.paused) return;

    if (this.foldStateManager.unfold(lineId)) {
      this.state.stepsUsed = this.foldStateManager.getCurrentStep();
      this.updateStepsDisplay();
    } else {
      this.origamiSVG?.foldLine(lineId, false);
      this.showMessage('只能撤销最后一步折痕，请先撤销后面的折痕。', 'info');
    }
    this.updateSubmitState();
  }

  private checkFoldComplete(): void {
    if (this.foldStateManager?.isComplete()) {
      this.showMessage('🎉 所有折叠完成！请选择正确的3D模型', 'info');
    }
    this.updateSubmitState();
  }

  private selectModel(modelId: string): void {
    if (this.state.gameStatus !== 'playing' || this.state.paused) return;

    this.state.selectedModelId = modelId;

    this.modelViewers.forEach(viewer => {
      viewer.setSelected(viewer.getModelId() === modelId);
    });

    this.container.querySelectorAll('.model-card').forEach(card => {
      const htmlCard = card as HTMLElement;
      htmlCard.classList.remove('selected');
      if (htmlCard.dataset.modelId === modelId) {
        htmlCard.classList.add('selected');
      }
    });

    this.updateSubmitState();

    if (!this.foldStateManager?.isComplete()) {
      this.showMessage('请先按顺序完成全部折叠，再提交答案。', 'info');
    }
  }

  private checkAnswer(): void {
    if (!this.state.currentQuestion || !this.state.selectedModelId || this.state.paused) return;

    if (!this.foldStateManager?.isComplete()) {
      this.updateSubmitState();
      this.showMessage('还没有完成折叠，先按提示折完再提交答案。', 'info');
      return;
    }

    const isCorrect = this.state.selectedModelId === this.state.currentQuestion.correctModelId;

    if (isCorrect) {
      const stepsBonus = Math.max(0, this.state.currentQuestion.maxSteps - this.state.stepsUsed) * 10;
      const baseScore = this.state.currentQuestion.difficulty * 100;
      this.state.score += baseScore + stepsBonus;
      this.state.gameStatus = 'won';
      this.showMessage(`🎉 答对了！获得 ${baseScore + stepsBonus} 分`, 'success');
    } else {
      this.state.gameStatus = 'lost';
      this.showMessage('😅 答错了，再试试吧！正确答案已高亮', 'error');
      this.highlightCorrectAnswer();
    }

    this.updateScoreDisplay();

    if (this.nextBtn) {
      this.nextBtn.style.display = 'inline-block';
    }

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
    }
  }

  private highlightCorrectAnswer(): void {
    if (!this.state.currentQuestion) return;

    const correctId = this.state.currentQuestion.correctModelId;
    this.container.querySelectorAll('.model-card').forEach(card => {
      const htmlCard = card as HTMLElement;
      if (htmlCard.dataset.modelId === correctId) {
        htmlCard.classList.add('correct');
      }
    });
  }

  private pauseGame(): void {
    if (this.state.gameStatus !== 'playing' || this.state.paused) return;

    this.state.paused = true;

    if (this.gameMain) {
      this.gameMain.style.visibility = 'hidden';
    }

    const questionInfo = this.container.querySelector('#question-info') as HTMLElement;
    if (questionInfo) {
      questionInfo.style.visibility = 'hidden';
    }

    if (this.pauseOverlay) {
      const pauseScoreValue = this.pauseOverlay.querySelector('#pause-score-value');
      if (pauseScoreValue) {
        pauseScoreValue.textContent = String(this.state.score);
      }
      this.pauseOverlay.style.display = 'flex';
    }

    if (this.pauseBtn) {
      this.pauseBtn.disabled = true;
    }
  }

  private resumeGame(): void {
    if (!this.state.paused) return;

    this.state.paused = false;

    if (this.gameMain) {
      this.gameMain.style.visibility = 'visible';
    }

    const questionInfo = this.container.querySelector('#question-info') as HTMLElement;
    if (questionInfo) {
      questionInfo.style.visibility = 'visible';
    }

    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'none';
    }

    if (this.pauseBtn) {
      this.pauseBtn.disabled = false;
    }
  }

  private resetFolds(): void {
    if (this.state.paused) return;

    this.origamiSVG?.reset();
    this.foldStateManager?.reset();
    this.state.stepsUsed = 0;
    this.state.gameStatus = 'playing';
    this.state.selectedModelId = null;

    this.modelViewers.forEach(viewer => viewer.setSelected(false));
    this.container.querySelectorAll('.model-card').forEach(card => {
      card.classList.remove('selected', 'correct');
    });

    this.updateSubmitState();
    if (this.nextBtn) {
      this.nextBtn.style.display = 'none';
    }

    this.hideMessage();
    this.updateStepsDisplay();
  }

  private showHint(): void {
    if (!this.foldStateManager || this.state.paused) return;

    const nextLine = this.foldStateManager.getNextFoldLine();

    if (nextLine) {
      const lineElement = this.container.querySelector(`[data-line-id="${nextLine.id}"]`);
      if (lineElement) {
        lineElement.classList.add('hint');
        setTimeout(() => {
          lineElement.classList.remove('hint');
        }, 2000);
      }
      this.showMessage(`💡 下一步：第 ${nextLine.order} 步 - ${nextLine.type === 'valley' ? '谷折' : '山折'}`, 'info');
    } else {
      this.showMessage('折叠已经完成，可以选择模型并提交答案。', 'info');
    }
  }

  private nextQuestion(): void {
    if (this.state.paused) return;

    this.currentQuestionIndex++;
    this.state.level++;
    this.loadQuestion(this.currentQuestionIndex);

    if (this.nextBtn) {
      this.nextBtn.style.display = 'none';
    }
    this.hideMessage();
  }

  private updateSubmitState(): void {
    if (!this.submitBtn) return;

    const canSubmit =
      this.state.gameStatus === 'playing' &&
      Boolean(this.state.selectedModelId) &&
      Boolean(this.foldStateManager?.isComplete());

    this.submitBtn.disabled = !canSubmit;
  }

  private formatFoldType(type: 'valley' | 'mountain'): string {
    return type === 'valley' ? '谷折' : '山折';
  }

  private updateUI(): void {
    this.updateLevelDisplay();
    this.updateScoreDisplay();
    this.updateStepsDisplay();
    this.updateQuestionInfo();
  }

  private updateLevelDisplay(): void {
    const levelDisplay = this.container.querySelector('#level-display');
    if (levelDisplay) {
      levelDisplay.textContent = String(this.state.level);
    }
  }

  private updateScoreDisplay(): void {
    const scoreDisplay = this.container.querySelector('#score-display');
    if (scoreDisplay) {
      scoreDisplay.textContent = String(this.state.score);
    }
  }

  private updateStepsDisplay(): void {
    const stepsDisplay = this.container.querySelector('#steps-display');
    if (stepsDisplay && this.state.currentQuestion) {
      stepsDisplay.textContent = `${this.state.stepsUsed}/${this.state.currentQuestion.maxSteps}`;
    }
  }

  private updateQuestionInfo(): void {
    const nameEl = this.container.querySelector('#question-name');
    const descEl = this.container.querySelector('#question-desc');

    if (nameEl && this.state.currentQuestion) {
      nameEl.textContent = this.state.currentQuestion.name;
    }
    if (descEl && this.state.currentQuestion) {
      descEl.textContent = this.state.currentQuestion.description;
    }
  }

  private showMessage(message: string, type: 'info' | 'success' | 'error'): void {
    const resultEl = this.container.querySelector('#result-message') as HTMLElement;
    if (resultEl) {
      resultEl.textContent = message;
      resultEl.className = `result-message ${type}`;
      resultEl.style.display = 'block';
    }
  }

  private hideMessage(): void {
    const resultEl = this.container.querySelector('#result-message') as HTMLElement;
    if (resultEl) {
      resultEl.style.display = 'none';
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  destroy(): void {
    this.origamiSVG?.destroy();
    this.modelViewers.forEach(viewer => viewer.destroy());
    this.container.innerHTML = '';
  }
}
