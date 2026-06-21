export interface FoldLine {
  id: string;
  type: 'valley' | 'mountain';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  order: number;
  angle: number;
  axisPoint: { x: number; y: number };
}

export interface Question {
  id: string;
  name: string;
  difficulty: number;
  maxSteps: number;
  paperSize: number;
  foldLines: FoldLine[];
  correctModelId: string;
  distractorModelIds: string[];
  description: string;
}

export const questionBank: Question[] = [
  {
    id: 'q1',
    name: '简单对折',
    difficulty: 1,
    maxSteps: 3,
    paperSize: 200,
    foldLines: [
      {
        id: 'f1',
        type: 'valley',
        x1: 100,
        y1: 0,
        x2: 100,
        y2: 200,
        order: 1,
        angle: 180,
        axisPoint: { x: 100, y: 100 }
      }
    ],
    correctModelId: 'rectangle-fold',
    distractorModelIds: ['triangle-fold', 'square-twist', 'crane-base'],
    description: '沿中线对折纸张'
  },
  {
    id: 'q2',
    name: '三角形基础',
    difficulty: 1,
    maxSteps: 3,
    paperSize: 200,
    foldLines: [
      {
        id: 'f1',
        type: 'valley',
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 200,
        order: 1,
        angle: 180,
        axisPoint: { x: 100, y: 100 }
      }
    ],
    correctModelId: 'triangle-fold',
    distractorModelIds: ['rectangle-fold', 'square-twist', 'crane-base'],
    description: '沿对角线对折'
  },
  {
    id: 'q3',
    name: '双折三角形',
    difficulty: 2,
    maxSteps: 4,
    paperSize: 200,
    foldLines: [
      {
        id: 'f1',
        type: 'valley',
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 200,
        order: 1,
        angle: 180,
        axisPoint: { x: 100, y: 100 }
      },
      {
        id: 'f2',
        type: 'valley',
        x1: 0,
        y1: 100,
        x2: 200,
        y2: 100,
        order: 2,
        angle: 90,
        axisPoint: { x: 100, y: 100 }
      }
    ],
    correctModelId: 'small-triangle',
    distractorModelIds: ['triangle-fold', 'rectangle-fold', 'square-twist'],
    description: '对角线折叠后再横向折叠'
  },
  {
    id: 'q4',
    name: '四角向心折',
    difficulty: 2,
    maxSteps: 5,
    paperSize: 200,
    foldLines: [
      {
        id: 'f1',
        type: 'valley',
        x1: 50,
        y1: 0,
        x2: 150,
        y2: 100,
        order: 1,
        angle: 45,
        axisPoint: { x: 100, y: 50 }
      },
      {
        id: 'f2',
        type: 'valley',
        x1: 200,
        y1: 50,
        x2: 100,
        y2: 150,
        order: 2,
        angle: 45,
        axisPoint: { x: 150, y: 100 }
      },
      {
        id: 'f3',
        type: 'valley',
        x1: 150,
        y1: 200,
        x2: 50,
        y2: 100,
        order: 3,
        angle: 45,
        axisPoint: { x: 100, y: 150 }
      },
      {
        id: 'f4',
        type: 'valley',
        x1: 0,
        y1: 150,
        x2: 100,
        y2: 50,
        order: 4,
        angle: 45,
        axisPoint: { x: 50, y: 100 }
      }
    ],
    correctModelId: 'square-twist',
    distractorModelIds: ['crane-base', 'small-triangle', 'rectangle-fold'],
    description: '四个角向中心折叠'
  },
  {
    id: 'q5',
    name: '千纸鹤基础形',
    difficulty: 3,
    maxSteps: 6,
    paperSize: 200,
    foldLines: [
      {
        id: 'f1',
        type: 'valley',
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 200,
        order: 1,
        angle: 180,
        axisPoint: { x: 100, y: 100 }
      },
      {
        id: 'f2',
        type: 'valley',
        x1: 100,
        y1: 0,
        x2: 100,
        y2: 200,
        order: 2,
        angle: 90,
        axisPoint: { x: 100, y: 100 }
      },
      {
        id: 'f3',
        type: 'mountain',
        x1: 50,
        y1: 50,
        x2: 150,
        y2: 150,
        order: 3,
        angle: 60,
        axisPoint: { x: 100, y: 100 }
      }
    ],
    correctModelId: 'crane-base',
    distractorModelIds: ['square-twist', 'small-triangle', 'triangle-fold'],
    description: '折叠出千纸鹤的基础形状'
  }
];

export const modelDescriptions: Record<string, { name: string; description: string }> = {
  'rectangle-fold': { name: '长方形', description: '对折后的矩形' },
  'triangle-fold': { name: '三角形', description: '对角线折叠后的三角形' },
  'small-triangle': { name: '小三角形', description: '两次折叠后的小三角形' },
  'square-twist': { name: '方形折', description: '四角向心折叠' },
  'crane-base': { name: '鹤基础形', description: '千纸鹤基础形状' }
};
