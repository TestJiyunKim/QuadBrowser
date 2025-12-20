
export interface FrameConfig {
  id: number;
  url: string;
  title?: string;
  isMaximized?: boolean;
}

export interface WorkspacePreset {
  name: string;
  urls: [string, string, string, string];
}

export enum FrameActionType {
  UPDATE_URL = 'UPDATE_URL',
  RELOAD = 'RELOAD',
  MAXIMIZE = 'MAXIMIZE',
  RESTORE = 'RESTORE',
}

export interface GeminiUrlResponse {
  workspaceName: string;
  urls: string[];
}
