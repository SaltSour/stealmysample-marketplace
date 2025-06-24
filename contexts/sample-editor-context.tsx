import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  ReactNode
} from "react"
import { useToast } from "@/hooks/use-toast"

export interface SamplePrice {
  wav: number
  stems: number
  midi: number
}

export interface Sample {
  id?: string
  title: string
  name: string
  url: string
  bpm: number
  key: string
  instrument: string
  tags: string[]
  duration: string
  isDemo: boolean
  waveform?: string
  price: number | SamplePrice
  license: "basic" | "premium" | "exclusive"
}

interface EditorState {
  samples: Sample[]
  isDirty: boolean
  lastSaved: Date | null
  isAutosaving: boolean
  selectedSampleId: string | null
  draftKey: string | null
}

type Action =
  | { type: "SET_SAMPLES"; payload: Sample[] }
  | { type: "UPDATE_SAMPLE"; payload: { id: string; updates: Partial<Sample> } }
  | { type: "ADD_SAMPLES"; payload: Sample[] }
  | { type: "REMOVE_SAMPLE"; payload: string }
  | { type: "SELECT_SAMPLE"; payload: string | null }
  | { type: "SET_AUTOSAVING"; payload: boolean }
  | { type: "SET_SAVED"; payload: Date }
  | { type: "LOAD_DRAFT" }
  | { type: "CLEAR_DRAFT" }

interface EditorContextType {
  state: EditorState
  addSamples: (samples: Sample[]) => void
  updateSample: (id: string, updates: Partial<Sample>) => void
  removeSample: (id: string) => void
  selectSample: (id: string | null) => void
  saveDraft: () => void
  clearDraft: () => void
}

const initialState: EditorState = {
  samples: [],
  isDirty: false,
  lastSaved: null,
  isAutosaving: false,
  selectedSampleId: null,
  draftKey: null
}

const SampleEditorContext = createContext<EditorContextType | undefined>(undefined)

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_SAMPLES":
      return {
        ...state,
        samples: action.payload,
        isDirty: true
      }
    case "UPDATE_SAMPLE":
      return {
        ...state,
        samples: state.samples.map(sample =>
          sample.id === action.payload.id
            ? { ...sample, ...action.payload.updates }
            : sample
        ),
        isDirty: true
      }
    case "ADD_SAMPLES":
      return {
        ...state,
        samples: [...state.samples, ...action.payload],
        isDirty: true
      }
    case "REMOVE_SAMPLE":
      return {
        ...state,
        samples: state.samples.filter(sample => sample.id !== action.payload),
        isDirty: true
      }
    case "SELECT_SAMPLE":
      return {
        ...state,
        selectedSampleId: action.payload
      }
    case "SET_AUTOSAVING":
      return {
        ...state,
        isAutosaving: action.payload
      }
    case "SET_SAVED":
      return {
        ...state,
        isDirty: false,
        lastSaved: action.payload
      }
    case "LOAD_DRAFT":
      const draftKey = `sample-editor-draft-${state.draftKey}`
      const savedState = localStorage.getItem(draftKey)
      if (savedState) {
        const { samples } = JSON.parse(savedState)
        return {
          ...state,
          samples,
          isDirty: true
        }
      }
      return state
    case "CLEAR_DRAFT":
      const keyToRemove = `sample-editor-draft-${state.draftKey}`
      localStorage.removeItem(keyToRemove)
      return {
        ...state,
        isDirty: false,
        lastSaved: null
      }
    default:
      return state
  }
}

export function SampleEditorProvider({
  children,
  packId
}: {
  children: ReactNode
  packId: string
}) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    draftKey: packId
  })
  const { toast } = useToast()

  // Autosave functionality
  useEffect(() => {
    if (!state.isDirty || state.isAutosaving) return

    const timeoutId = setTimeout(async () => {
      dispatch({ type: "SET_AUTOSAVING", payload: true })

      try {
        // Save to localStorage as draft
        const draftKey = `sample-editor-draft-${packId}`
        localStorage.setItem(draftKey, JSON.stringify({
          samples: state.samples,
          timestamp: new Date().toISOString()
        }))

        // Save to server
        const formattedSamples = state.samples.map(sample => ({
          id: sample.id,
          name: sample.title || sample.name,
          url: sample.url,
          waveform: sample.waveform,
          duration: sample.duration,
          bpm: sample.bpm || null,
          key: sample.key || null,
          tags: sample.tags || [],
          price: typeof sample.price === 'object' ? (sample.price as SamplePrice).wav : sample.price || 0
        }))

        await fetch(`/api/packs/${packId}/samples`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ samples: formattedSamples })
        })

        dispatch({ type: "SET_SAVED", payload: new Date() })
        toast({
          title: "Changes saved",
          description: "All changes have been saved automatically",
        })
      } catch (error) {
        console.error("Autosave error:", error)
        toast({
          title: "Save failed",
          description: "Your changes couldn't be saved. They're kept as a draft.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: "SET_AUTOSAVING", payload: false })
      }
    }, 2000) // Autosave after 2 seconds of no changes

    return () => clearTimeout(timeoutId)
  }, [state.isDirty, state.samples, packId, state.isAutosaving, toast])

  // Load draft on mount
  useEffect(() => {
    dispatch({ type: "LOAD_DRAFT" })
  }, [])

  const addSamples = useCallback((samples: Sample[]) => {
    dispatch({ type: "ADD_SAMPLES", payload: samples })
  }, [])

  const updateSample = useCallback((id: string, updates: Partial<Sample>) => {
    dispatch({ type: "UPDATE_SAMPLE", payload: { id, updates } })
  }, [])

  const removeSample = useCallback((id: string) => {
    dispatch({ type: "REMOVE_SAMPLE", payload: id })
  }, [])

  const selectSample = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_SAMPLE", payload: id })
  }, [])

  const saveDraft = useCallback(() => {
    const draftKey = `sample-editor-draft-${packId}`
    localStorage.setItem(draftKey, JSON.stringify({
      samples: state.samples,
      timestamp: new Date().toISOString()
    }))
  }, [state.samples, packId])

  const clearDraft = useCallback(() => {
    dispatch({ type: "CLEAR_DRAFT" })
  }, [])

  return (
    <SampleEditorContext.Provider
      value={{
        state,
        addSamples,
        updateSample,
        removeSample,
        selectSample,
        saveDraft,
        clearDraft
      }}
    >
      {children}
    </SampleEditorContext.Provider>
  )
}

export function useSampleEditor() {
  const context = useContext(SampleEditorContext)
  if (context === undefined) {
    throw new Error("useSampleEditor must be used within a SampleEditorProvider")
  }
  return context
} 