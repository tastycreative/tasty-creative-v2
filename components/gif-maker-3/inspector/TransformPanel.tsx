/**
 * Transform panel for the clip Inspector
 * Provides controls for scale, position, rotation, and fit mode
 */

import React, { useCallback } from 'react';
import { RotateCcw, Move, RotateCw, Maximize, Minimize } from 'lucide-react';
import { TRANSFORM_PRESETS } from '../utils/transformUtils';

interface TransformPanelProps {
  clipId: string;
  transform: ClipTransform;
  onTransformChange: (clipId: string, transform: Partial<ClipTransform>) => void;
  onResetTransform: (clipId: string) => void;
}

export const TransformPanel: React.FC<TransformPanelProps> = React.memo(({
  clipId,
  transform,
  onTransformChange,
  onResetTransform,
}) => {
  const handleInputChange = useCallback((field: keyof ClipTransform, value: number | string) => {
    onTransformChange(clipId, { [field]: value });
  }, [clipId, onTransformChange]);

  const handlePresetApply = useCallback((presetName: keyof typeof TRANSFORM_PRESETS) => {
    const preset = TRANSFORM_PRESETS[presetName]();
    onTransformChange(clipId, preset);
  }, [clipId, onTransformChange]);

  return (
    <div className="space-y-4">
      {/* Transform Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePresetApply('fit')}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            <Minimize className="w-3 h-3" />
            Fit
          </button>
          <button
            onClick={() => handlePresetApply('fill')}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            <Maximize className="w-3 h-3" />
            Fill
          </button>
          <button
            onClick={() => handlePresetApply('center')}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            <Move className="w-3 h-3" />
            Center
          </button>
          <button
            onClick={() => onResetTransform(clipId)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Position Controls */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Position
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">X (px)</label>
            <input
              type="number"
              value={Math.round(transform.positionX)}
              onChange={(e) => handleInputChange('positionX', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              step="1"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Y (px)</label>
            <input
              type="number"
              value={Math.round(transform.positionY)}
              onChange={(e) => handleInputChange('positionY', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Scale Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Scale: {Math.round(transform.scale * 100)}%
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={transform.scale}
            onChange={(e) => handleInputChange('scale', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <input
            type="number"
            value={Math.round(transform.scale * 100)}
            onChange={(e) => handleInputChange('scale', (parseFloat(e.target.value) || 100) / 100)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            min="10"
            max="500"
            step="1"
          />
        </div>
      </div>

      {/* Rotation Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Rotation: {Math.round(transform.rotation)}°
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="359"
            step="1"
            value={transform.rotation}
            onChange={(e) => handleInputChange('rotation', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={Math.round(transform.rotation)}
              onChange={(e) => handleInputChange('rotation', parseFloat(e.target.value) || 0)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              min="0"
              max="359"
              step="1"
            />
            <button
              onClick={() => handleInputChange('rotation', (transform.rotation - 90) % 360)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
              title="Rotate -90°"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleInputChange('rotation', (transform.rotation + 90) % 360)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md transition-colors"
              title="Rotate +90°"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Fit Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Fit Mode
        </label>
        <select
          value={transform.fitMode}
          onChange={(e) => handleInputChange('fitMode', e.target.value as ClipTransform['fitMode'])}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
        >
          <option value="contain">Contain (fit inside)</option>
          <option value="cover">Cover (fill frame)</option>
          <option value="fill">Fill (stretch to fit)</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {transform.fitMode === 'contain' && 'Video fits completely inside frame'}
          {transform.fitMode === 'cover' && 'Video fills frame, may crop edges'}
          {transform.fitMode === 'fill' && 'Video stretches to fill frame exactly'}
        </p>
      </div>

      {/* Crop Controls (Optional - for advanced users) */}
      {transform.crop && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Crop (px)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Top</label>
              <input
                type="number"
                value={transform.crop.top}
                onChange={(e) => handleInputChange('crop', { 
                  ...transform.crop, 
                  top: parseFloat(e.target.value) || 0 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Right</label>
              <input
                type="number"
                value={transform.crop.right}
                onChange={(e) => handleInputChange('crop', { 
                  ...transform.crop, 
                  right: parseFloat(e.target.value) || 0 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Bottom</label>
              <input
                type="number"
                value={transform.crop.bottom}
                onChange={(e) => handleInputChange('crop', { 
                  ...transform.crop, 
                  bottom: parseFloat(e.target.value) || 0 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Left</label>
              <input
                type="number"
                value={transform.crop.left}
                onChange={(e) => handleInputChange('crop', { 
                  ...transform.crop, 
                  left: parseFloat(e.target.value) || 0 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transform Info */}
      <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
        <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
          <div>Use handles in player to drag and resize</div>
          <div>Arrow keys: nudge position (Alt=fine, Ctrl=coarse)</div>
          <div>Shift while dragging: snap to grid/constrain aspect</div>
        </div>
      </div>
    </div>
  );
});

TransformPanel.displayName = 'TransformPanel';