'use client';

import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useReducer } from 'react';
import { handleAndShowError } from '@/lib/error-handler';
import type { FileRow, Segment, Term, TranscriptRow } from '@/types/database';

// 状态接口
export interface AppState {
  files: FileRow[];
  transcripts: TranscriptRow[];
  segments: Segment[];
  terms: Term[];
  currentFile?: FileRow;
  currentTranscript?: TranscriptRow;
  isLoading: boolean;
  error?: string;
  audioPlayer: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    playbackRate: number;
    loopStart?: number;
    loopEnd?: number;
  };
  ui: {
    sidebarOpen: boolean;
    terminologyPanelOpen: boolean;
    darkMode: boolean;
  };
}

// 动作类型
type AppAction =
  | { type: 'SET_FILES'; payload: FileRow[] }
  | { type: 'ADD_FILE'; payload: FileRow }
  | { type: 'UPDATE_FILE'; payload: { id: number; updates: Partial<FileRow> } }
  | { type: 'DELETE_FILE'; payload: number }
  | { type: 'SET_CURRENT_FILE'; payload?: FileRow }
  | { type: 'SET_TRANSCRIPTS'; payload: TranscriptRow[] }
  | { type: 'ADD_TRANSCRIPT'; payload: TranscriptRow }
  | {
      type: 'UPDATE_TRANSCRIPT';
      payload: { id: number; updates: Partial<TranscriptRow> };
    }
  | { type: 'DELETE_TRANSCRIPT'; payload: number }
  | { type: 'SET_CURRENT_TRANSCRIPT'; payload?: TranscriptRow }
  | { type: 'SET_SEGMENTS'; payload: Segment[] }
  | { type: 'ADD_SEGMENTS'; payload: Segment[] }
  | {
      type: 'UPDATE_SEGMENT';
      payload: { id: number; updates: Partial<Segment> };
    }
  | { type: 'SET_TERMS'; payload: Term[] }
  | { type: 'ADD_TERM'; payload: Term }
  | { type: 'UPDATE_TERM'; payload: Term }
  | { type: 'DELETE_TERM'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'UPDATE_AUDIO_PLAYER'; payload: Partial<AppState['audioPlayer']> }
  | { type: 'UPDATE_UI'; payload: Partial<AppState['ui']> }
  | { type: 'RESET_STATE' };

// 初始状态
const initialState: AppState = {
  files: [],
  transcripts: [],
  segments: [],
  terms: [],
  isLoading: false,
  audioPlayer: {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    playbackRate: 1,
  },
  ui: {
    sidebarOpen: true,
    terminologyPanelOpen: false,
    darkMode: false,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };

    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.payload.id
            ? { ...file, ...action.payload.updates, updatedAt: new Date() }
            : file
        ),
      };

    case 'DELETE_FILE': {
      const updatedFiles = state.files.filter((file) => file.id !== action.payload);
      return {
        ...state,
        files: updatedFiles,
        currentFile: state.currentFile?.id === action.payload ? undefined : state.currentFile,
      };
    }

    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload };

    case 'SET_TRANSCRIPTS':
      return { ...state, transcripts: action.payload };

    case 'ADD_TRANSCRIPT':
      return { ...state, transcripts: [...state.transcripts, action.payload] };

    case 'UPDATE_TRANSCRIPT':
      return {
        ...state,
        transcripts: state.transcripts.map((transcript) =>
          transcript.id === action.payload.id
            ? {
                ...transcript,
                ...action.payload.updates,
                updatedAt: new Date(),
              }
            : transcript
        ),
      };

    case 'DELETE_TRANSCRIPT':
      return {
        ...state,
        transcripts: state.transcripts.filter((t) => t.id !== action.payload),
        currentTranscript:
          state.currentTranscript?.id === action.payload ? undefined : state.currentTranscript,
      };

    case 'SET_CURRENT_TRANSCRIPT':
      return { ...state, currentTranscript: action.payload };

    case 'SET_SEGMENTS':
      return { ...state, segments: action.payload };

    case 'ADD_SEGMENTS':
      return { ...state, segments: [...state.segments, ...action.payload] };

    case 'UPDATE_SEGMENT':
      return {
        ...state,
        segments: state.segments.map((segment) =>
          segment.id === action.payload.id
            ? { ...segment, ...action.payload.updates, updatedAt: new Date() }
            : segment
        ),
      };

    case 'SET_TERMS':
      return { ...state, terms: action.payload };

    case 'ADD_TERM':
      return { ...state, terms: [...state.terms, action.payload] };

    case 'UPDATE_TERM':
      return {
        ...state,
        terms: state.terms.map((term) =>
          term.id === action.payload.id ? { ...action.payload, updatedAt: new Date() } : term
        ),
      };

    case 'DELETE_TERM':
      return {
        ...state,
        terms: state.terms.filter((term) => term.id !== action.payload),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'UPDATE_AUDIO_PLAYER':
      return {
        ...state,
        audioPlayer: { ...state.audioPlayer, ...action.payload },
      };

    case 'UPDATE_UI':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: AppActions;
} | null>(null);

// 动作接口
interface AppActions {
  setFiles: (files: FileRow[]) => void;
  addFile: (file: FileRow) => void;
  updateFile: (id: number, updates: Partial<FileRow>) => void;
  deleteFile: (id: number) => void;
  setCurrentFile: (file?: FileRow) => void;
  setTranscripts: (transcripts: TranscriptRow[]) => void;
  addTranscript: (transcript: TranscriptRow) => void;
  updateTranscript: (id: number, updates: Partial<TranscriptRow>) => void;
  deleteTranscript: (id: number) => void;
  setCurrentTranscript: (transcript?: TranscriptRow) => void;
  setSegments: (segments: Segment[]) => void;
  addSegments: (segments: Segment[]) => void;
  updateSegment: (id: number, updates: Partial<Segment>) => void;
  setTerms: (terms: Term[]) => void;
  addTerm: (term: Term) => void;
  updateTerm: (term: Term) => void;
  deleteTerm: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  updateAudioPlayer: (updates: Partial<AppState['audioPlayer']>) => void;
  updateUi: (updates: Partial<AppState['ui']>) => void;
  resetState: () => void;
}

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 创建动作对象
  const actions: AppActions = {
    setFiles: useCallback((files: FileRow[]) => {
      dispatch({ type: 'SET_FILES', payload: files });
    }, []),

    addFile: useCallback((file: FileRow) => {
      dispatch({ type: 'ADD_FILE', payload: file });
    }, []),

    updateFile: useCallback((id: number, updates: Partial<FileRow>) => {
      dispatch({ type: 'UPDATE_FILE', payload: { id, updates } });
    }, []),

    deleteFile: useCallback((id: number) => {
      dispatch({ type: 'DELETE_FILE', payload: id });
    }, []),

    setCurrentFile: useCallback((file?: FileRow) => {
      dispatch({ type: 'SET_CURRENT_FILE', payload: file });
    }, []),

    setTranscripts: useCallback((transcripts: TranscriptRow[]) => {
      dispatch({ type: 'SET_TRANSCRIPTS', payload: transcripts });
    }, []),

    addTranscript: useCallback((transcript: TranscriptRow) => {
      dispatch({ type: 'ADD_TRANSCRIPT', payload: transcript });
    }, []),

    updateTranscript: useCallback((id: number, updates: Partial<TranscriptRow>) => {
      dispatch({ type: 'UPDATE_TRANSCRIPT', payload: { id, updates } });
    }, []),

    deleteTranscript: useCallback((id: number) => {
      dispatch({ type: 'DELETE_TRANSCRIPT', payload: id });
    }, []),

    setCurrentTranscript: useCallback((transcript?: TranscriptRow) => {
      dispatch({ type: 'SET_CURRENT_TRANSCRIPT', payload: transcript });
    }, []),

    setSegments: useCallback((segments: Segment[]) => {
      dispatch({ type: 'SET_SEGMENTS', payload: segments });
    }, []),

    addSegments: useCallback((segments: Segment[]) => {
      dispatch({ type: 'ADD_SEGMENTS', payload: segments });
    }, []),

    updateSegment: useCallback((id: number, updates: Partial<Segment>) => {
      dispatch({ type: 'UPDATE_SEGMENT', payload: { id, updates } });
    }, []),

    setTerms: useCallback((terms: Term[]) => {
      dispatch({ type: 'SET_TERMS', payload: terms });
    }, []),

    addTerm: useCallback((term: Term) => {
      dispatch({ type: 'ADD_TERM', payload: term });
    }, []),

    updateTerm: useCallback((term: Term) => {
      dispatch({ type: 'UPDATE_TERM', payload: term });
    }, []),

    deleteTerm: useCallback((id: number) => {
      dispatch({ type: 'DELETE_TERM', payload: id });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error?: string) => {
      dispatch({ type: 'SET_ERROR', payload: error });
      if (error) {
        handleAndShowError(new Error(error), 'AppContext');
      }
    }, []),

    updateAudioPlayer: useCallback((updates: Partial<AppState['audioPlayer']>) => {
      dispatch({ type: 'UPDATE_AUDIO_PLAYER', payload: updates });
    }, []),

    updateUi: useCallback((updates: Partial<AppState['ui']>) => {
      dispatch({ type: 'UPDATE_UI', payload: updates });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, []),
  };

  return <AppContext.Provider value={{ state, dispatch, actions }}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// 选择器 hooks 用于优化性能
export function useFiles() {
  const { state, actions } = useApp();
  return { files: state.files, ...actions };
}

export function useCurrentFile() {
  const { state, actions } = useApp();
  return {
    currentFile: state.currentFile,
    setCurrentFile: actions.setCurrentFile,
  };
}

export function useAudioPlayer() {
  const { state, actions } = useApp();
  return {
    audioPlayer: state.audioPlayer,
    updateAudioPlayer: actions.updateAudioPlayer,
  };
}

export function useUi() {
  const { state, actions } = useApp();
  return { ui: state.ui, updateUi: actions.updateUi };
}

export function useLoading() {
  const { state, actions } = useApp();
  return { isLoading: state.isLoading, setLoading: actions.setLoading };
}
