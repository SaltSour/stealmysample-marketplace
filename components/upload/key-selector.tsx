"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Music } from "lucide-react"

interface KeySelectorProps {
  selectedKey: string | null
  onKeySelect: (key: string | null) => void
  disabled?: boolean
  compact?: boolean
}

export function KeySelector({ 
  selectedKey, 
  onKeySelect, 
  disabled = false,
  compact = false 
}: KeySelectorProps) {
  const [isFlat, setIsFlat] = useState(true)
  const [isMinor, setIsMinor] = useState(false)
  const [open, setOpen] = useState(false)
  const [localSelectedKey, setLocalSelectedKey] = useState<string | null>(selectedKey)

  // Organize keys in a more logical order
  const keys = ["C", "D", "E", "F", "G", "A", "B"]
  const flats = ["Db", "Eb", "Gb", "Ab", "Bb"]
  const sharps = ["C#", "D#", "F#", "G#", "A#"]

  const handleKeySelect = (key: string | null) => {
    if (!key) return
    const selectedKeyWithMode = `${key}${isMinor ? "m" : ""}`
    setLocalSelectedKey(selectedKeyWithMode);
  }

  const handleConfirm = () => {
    onKeySelect(localSelectedKey);
    setOpen(false);
  }

  const displayKey = selectedKey || "Select Key"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn(
            compact ? "h-8 px-3" : "min-w-[120px] justify-start",
            disabled && "opacity-50 cursor-not-allowed",
            selectedKey && "text-primary"
          )}
          disabled={disabled}
        >
          {compact ? (
            selectedKey || "Key"
          ) : (
            <>
              <Music className={cn(
                "h-4 w-4 mr-2",
                !selectedKey && "text-muted-foreground"
              )} />
              {displayKey}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[280px] bg-zinc-950 text-zinc-50 p-4">
        <div className="grid gap-3">
          {/* Accidental Toggle */}
          <div className="flex rounded-md overflow-hidden bg-zinc-900">
            <Button
              type="button"
              variant={isFlat ? "default" : "ghost"}
              className={cn(
                "flex-1 rounded-none border-0 h-8",
                isFlat ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-zinc-100"
              )}
              onClick={() => setIsFlat(true)}
            >
              Flat
            </Button>
            <Button
              type="button"
              variant={!isFlat ? "default" : "ghost"}
              className={cn(
                "flex-1 rounded-none border-0 h-8",
                !isFlat ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-zinc-100"
              )}
              onClick={() => setIsFlat(false)}
            >
              Sharp
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-md overflow-hidden bg-zinc-900">
            <Button
              type="button"
              variant={!isMinor ? "default" : "ghost"}
              className={cn(
                "flex-1 rounded-none border-0 h-8",
                !isMinor ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-zinc-100"
              )}
              onClick={() => setIsMinor(false)}
            >
              Major
            </Button>
            <Button
              type="button"
              variant={isMinor ? "default" : "ghost"}
              className={cn(
                "flex-1 rounded-none border-0 h-8",
                isMinor ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-zinc-100"
              )}
              onClick={() => setIsMinor(true)}
            >
              Minor
            </Button>
          </div>

          {/* Accidentals Row */}
          <div className="grid grid-cols-7 gap-1">
            <div className="col-span-1" />
            {(isFlat ? flats : sharps).map((key, index) => (
              <Button
                key={key}
                variant="ghost"
                className={cn(
                  "h-8 px-0 hover:bg-zinc-800",
                  localSelectedKey === `${key}${isMinor ? "m" : ""}` && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleKeySelect(key)}
              >
                {key}
              </Button>
            ))}
            <div className="col-span-1" />
          </div>

          {/* Natural Keys Row */}
          <div className="grid grid-cols-7 gap-1">
            {keys.map((key) => (
              <Button
                key={key}
                variant="ghost"
                className={cn(
                  "h-8 px-0 hover:bg-zinc-800",
                  localSelectedKey === `${key}${isMinor ? "m" : ""}` && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleKeySelect(key)}
              >
                {key}
              </Button>
            ))}
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={handleConfirm}
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 