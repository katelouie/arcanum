import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CardPosition {
  x: number;
  y: number;
  rotation?: number;
  zIndex?: number;
}

interface LayoutCard {
  id: string;
  name: string;
  position: CardPosition;
  isDragging: boolean;
}

interface SpreadLayoutCreatorProps {
  onExport?: (layout: any) => void;
}

export function SpreadLayoutCreator({ onExport }: SpreadLayoutCreatorProps) {
  const [layoutName, setLayoutName] = useState('');
  const [cards, setCards] = useState<LayoutCard[]>([]);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const addCard = () => {
    const newCard: LayoutCard = {
      id: `card-${cards.length + 1}`,
      name: `Position ${cards.length + 1}`,
      position: { x: 50, y: 50 }, // Center by default
      isDragging: false
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (cardId: string) => {
    setCards(cards.filter(card => card.id !== cardId));
  };

  const updateCardName = (cardId: string, name: string) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, name } : card
    ));
  };

  const updateCardRotation = (cardId: string, rotation: number) => {
    setCards(cards.map(card => 
      card.id === cardId 
        ? { ...card, position: { ...card.position, rotation } }
        : card
    ));
  };

  const handleMouseDown = (cardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedCard(cardId);
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isDragging: true } : card
    ));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedCard || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to container bounds
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setCards(cards => cards.map(card => 
      card.id === draggedCard 
        ? { ...card, position: { ...card.position, x: clampedX, y: clampedY } }
        : card
    ));
  }, [draggedCard]);

  const handleMouseUp = useCallback(() => {
    if (draggedCard) {
      setCards(cards => cards.map(card => ({ ...card, isDragging: false })));
      setDraggedCard(null);
    }
  }, [draggedCard]);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (draggedCard) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedCard, handleMouseMove, handleMouseUp]);

  const exportLayout = () => {
    const layout = {
      name: layoutName || 'Custom Layout',
      positions: cards.map(card => ({
        x: Math.round(card.position.x * 10) / 10, // Round to 1 decimal
        y: Math.round(card.position.y * 10) / 10,
        ...(card.position.rotation && { rotation: card.position.rotation }),
        ...(card.position.zIndex && { zIndex: card.position.zIndex })
      }))
    };

    const output = JSON.stringify(layout, null, 2);
    
    if (onExport) {
      onExport(layout);
    } else {
      // Copy to clipboard and show in console
      navigator.clipboard.writeText(output);
      console.log('Layout JSON:', output);
      alert('Layout JSON copied to clipboard!');
    }
  };

  const clearLayout = () => {
    setCards([]);
    setLayoutName('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Spread Layout Creator</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="layout-name" className="text-slate-200">Layout Name</Label>
            <Input
              id="layout-name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Enter layout name"
              className="bg-slate-700 border-slate-600 text-slate-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={addCard} className="bg-violet-600 hover:bg-violet-700">
              Add Card
            </Button>
            <Button 
              onClick={() => setShowGrid(!showGrid)} 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {showGrid ? 'Hide' : 'Show'} Grid
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Button 
              onClick={exportLayout} 
              disabled={cards.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Export JSON
            </Button>
            <Button 
              onClick={clearLayout} 
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Layout Canvas */}
        <div className="relative">
          <div 
            ref={containerRef}
            className={`relative w-full bg-gradient-to-br from-slate-900/20 to-slate-800/20 rounded-xl border border-slate-700/50 ${
              showGrid ? 'bg-grid-slate-700/20' : ''
            }`}
            style={{ 
              height: '600px',
              backgroundImage: showGrid ? 
                'radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)' : undefined,
              backgroundSize: showGrid ? '20px 20px' : undefined
            }}
          >
            {/* Percentage guides */}
            {showGrid && (
              <>
                <div className="absolute inset-0 pointer-events-none">
                  {[25, 50, 75].map(percent => (
                    <React.Fragment key={`guides-${percent}`}>
                      {/* Vertical guides */}
                      <div 
                        className="absolute h-full w-px bg-slate-600/30" 
                        style={{ left: `${percent}%` }}
                      />
                      {/* Horizontal guides */}
                      <div 
                        className="absolute w-full h-px bg-slate-600/30" 
                        style={{ top: `${percent}%` }}
                      />
                    </React.Fragment>
                  ))}
                </div>
                
                {/* Corner labels */}
                <div className="absolute top-2 left-2 text-xs text-slate-500">0,0</div>
                <div className="absolute top-2 right-2 text-xs text-slate-500">100,0</div>
                <div className="absolute bottom-2 left-2 text-xs text-slate-500">0,100</div>
                <div className="absolute bottom-2 right-2 text-xs text-slate-500">100,100</div>
              </>
            )}

            {/* Draggable Cards */}
            {cards.map((card) => (
              <div
                key={card.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${card.position.x}%`,
                  top: `${card.position.y}%`,
                  zIndex: card.position.zIndex || 0,
                }}
              >
                <div className="text-center">
                  <div
                    className={`w-16 h-24 bg-violet-600 rounded-lg shadow-xl border-2 cursor-move flex items-center justify-center text-white text-xs font-bold transition-all duration-200 ${
                      card.isDragging 
                        ? 'border-yellow-400 shadow-2xl scale-105' 
                        : 'border-violet-500 hover:border-violet-400 hover:shadow-2xl'
                    }`}
                    style={{
                      transform: card.position.rotation ? `rotate(${card.position.rotation}deg)` : undefined
                    }}
                    onMouseDown={(e) => handleMouseDown(card.id, e)}
                  >
                    {card.id.split('-')[1]}
                  </div>
                  <div className="mt-2 max-w-20">
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {card.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round(card.position.x)}, {Math.round(card.position.y)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card List */}
        {cards.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Cards in Layout</h3>
            <div className="grid gap-3">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <div className="w-8 h-8 bg-violet-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    {card.id.split('-')[1]}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={card.name}
                      onChange={(e) => updateCardName(card.id, e.target.value)}
                      className="bg-slate-600 border-slate-500 text-slate-100"
                      placeholder="Position name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-400 text-sm">Rotation:</Label>
                    <Input
                      type="number"
                      value={card.position.rotation || 0}
                      onChange={(e) => updateCardRotation(card.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-slate-600 border-slate-500 text-slate-100"
                      step="90"
                    />
                  </div>
                  <div className="text-sm text-slate-400">
                    ({Math.round(card.position.x)}, {Math.round(card.position.y)})
                  </div>
                  <Button
                    onClick={() => removeCard(card.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">Instructions:</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Click "Add Card" to add new card positions</li>
            <li>• Drag cards around the canvas to position them</li>
            <li>• Edit position names and rotation angles in the list below</li>
            <li>• Use the grid guides to align cards at common positions</li>
            <li>• Click "Export JSON" to get the layout configuration for your spreads-config.json</li>
          </ul>
        </div>
      </div>
    </div>
  );
}