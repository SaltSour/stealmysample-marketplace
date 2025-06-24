import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatPrice } from "@/lib/utils"

export interface PriceConfig {
  hasWav: boolean
  hasStems: boolean
  hasMidi: boolean
  wavPrice: number | null
  stemsPrice: number | null
  midiPrice: number | null
}

interface PriceSelectorProps {
  prices: PriceConfig
  onPriceChange: (prices: PriceConfig) => void
}

export function PriceSelector({ prices, onPriceChange }: PriceSelectorProps) {
  const handleFormatToggle = (format: 'wav' | 'stems' | 'midi') => {
    const updates = {
      hasWav: format === 'wav' ? !prices.hasWav : prices.hasWav,
      hasStems: format === 'stems' ? !prices.hasStems : prices.hasStems,
      hasMidi: format === 'midi' ? !prices.hasMidi : prices.hasMidi,
      wavPrice: format === 'wav' && !prices.hasWav ? 0.99 : prices.wavPrice,
      stemsPrice: format === 'stems' && !prices.hasStems ? 4.99 : prices.stemsPrice,
      midiPrice: format === 'midi' && !prices.hasMidi ? 1.99 : prices.midiPrice,
    }
    onPriceChange(updates)
  }

  const handlePriceChange = (format: 'wav' | 'stems' | 'midi', value: string) => {
    const price = parseFloat(value) || 0
    onPriceChange({
      ...prices,
      [`${format}Price`]: price >= 0 ? price : 0
    } as PriceConfig)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="wav-toggle">WAV Format</Label>
            <Switch
              id="wav-toggle"
              checked={prices.hasWav}
              onCheckedChange={() => handleFormatToggle('wav')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Single WAV file of the complete sample
            {!prices.hasWav && <span className="block mt-1 text-yellow-400/70">Note: This format will appear disabled to buyers</span>}
          </p>
          {prices.hasWav && (
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prices.wavPrice || ''}
                onChange={(e) => handlePriceChange('wav', e.target.value)}
                placeholder="WAV Price"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="stems-toggle">Stems Format</Label>
            <Switch
              id="stems-toggle"
              checked={prices.hasStems}
              onCheckedChange={() => handleFormatToggle('stems')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Individual stems as WAV files (upload as .zip, .rar, or .7z archive)
            {!prices.hasStems && <span className="block mt-1 text-yellow-400/70">Note: This format will appear disabled to buyers</span>}
          </p>
          {prices.hasStems && (
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prices.stemsPrice || ''}
                onChange={(e) => handlePriceChange('stems', e.target.value)}
                placeholder="Stems Price"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="midi-toggle">MIDI Format</Label>
            <Switch
              id="midi-toggle"
              checked={prices.hasMidi}
              onCheckedChange={() => handleFormatToggle('midi')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            MIDI files containing the musical arrangement
            {!prices.hasMidi && <span className="block mt-1 text-yellow-400/70">Note: This format will appear disabled to buyers</span>}
          </p>
          {prices.hasMidi && (
            <div className="mt-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={prices.midiPrice || ''}
                onChange={(e) => handlePriceChange('midi', e.target.value)}
                placeholder="MIDI Price"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 