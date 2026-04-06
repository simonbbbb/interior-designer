import { useCallback } from 'react';
import type { FurnitureCategory, FurnitureDefinition } from '@/types';

const CATEGORIES: { id: FurnitureCategory; label: string; icon: string }[] = [
  { id: 'bedroom', label: 'Bedroom', icon: '🛏' },
  { id: 'living_room', label: 'Living Room', icon: '🛋' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'dining', label: 'Dining', icon: '🍽' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'appliances', label: 'Appliances', icon: '🔌' },
];

const FURNITURE: FurnitureDefinition[] = [
  // Bedroom
  { id: 'king-bed', name: 'King Bed (6.3×6.6)', category: 'bedroom', width: 6.3, depth: 6.6, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'queen-bed', name: 'Queen Bed (5.0×6.6)', category: 'bedroom', width: 5.0, depth: 6.6, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'nightstand', name: 'Nightstand (1.5×1.5)', category: 'bedroom', width: 1.5, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  { id: 'dresser', name: 'Dresser (5.0×1.5)', category: 'bedroom', width: 5.0, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  // Living Room
  { id: 'sofa-3', name: '3-Seater Sofa (7×3)', category: 'living_room', width: 7.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'loveseat', name: 'Loveseat (5×3)', category: 'living_room', width: 5.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'armchair', name: 'Armchair (3×3)', category: 'living_room', width: 3.0, depth: 3.0, shape: 'rectangle', color: '#7C3AED', fillColor: '#EDE9FE', svgPath: '' },
  { id: 'coffee-table', name: 'Coffee Table (4×2)', category: 'living_room', width: 4.0, depth: 2.0, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  { id: 'tv-stand', name: 'TV Stand (5×1.5)', category: 'living_room', width: 5.0, depth: 1.5, shape: 'rectangle', color: '#374151', fillColor: '#E5E7EB', svgPath: '' },
  // Kitchen
  { id: 'dining-table-6', name: 'Dining Table 6-seat (6×3)', category: 'kitchen', width: 6.0, depth: 3.0, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  { id: 'dining-chair', name: 'Dining Chair (1.5×1.5)', category: 'kitchen', width: 1.5, depth: 1.5, shape: 'rectangle', color: '#B45309', fillColor: '#FDE68A', svgPath: '' },
  { id: 'kitchen-island', name: 'Kitchen Island (5×2.5)', category: 'kitchen', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  { id: 'bar-stool', name: 'Bar Stool (1.5×1.5)', category: 'kitchen', width: 1.5, depth: 1.5, shape: 'circle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  // Bathroom
  { id: 'vanity', name: 'Vanity (4×1.7)', category: 'bathroom', width: 4.0, depth: 1.7, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'bathtub', name: 'Bathtub (5×2.5)', category: 'bathroom', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'shower', name: 'Shower (3×3)', category: 'bathroom', width: 3.0, depth: 3.0, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  { id: 'toilet', name: 'Toilet (2.5×1.5)', category: 'bathroom', width: 1.5, depth: 2.5, shape: 'rectangle', color: '#0891B2', fillColor: '#CFFAFE', svgPath: '' },
  // Dining
  { id: 'bookshelf', name: 'Bookshelf (4×1.5)', category: 'dining', width: 4.0, depth: 1.5, shape: 'rectangle', color: '#92400E', fillColor: '#FEF3C7', svgPath: '' },
  // Office
  { id: 'desk', name: 'Desk (5×2.5)', category: 'office', width: 5.0, depth: 2.5, shape: 'rectangle', color: '#6B7280', fillColor: '#F3F4F6', svgPath: '' },
  { id: 'office-chair', name: 'Office Chair (2×2)', category: 'office', width: 2.0, depth: 2.0, shape: 'circle', color: '#374151', fillColor: '#E5E7EB', svgPath: '' },
  // Appliances
  { id: 'fridge', name: 'Refrigerator (2.5×2.5)', category: 'appliances', width: 2.5, depth: 2.5, shape: 'rectangle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
  { id: 'washer', name: 'Washer (2.5×2.5)', category: 'appliances', width: 2.5, depth: 2.5, shape: 'circle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
  { id: 'dryer', name: 'Dryer (2.5×2.5)', category: 'appliances', width: 2.5, depth: 2.5, shape: 'circle', color: '#1F2937', fillColor: '#D1D5DB', svgPath: '' },
];

export function FurnitureSidebar() {
  return (
    <div className="flex w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Furniture</h2>
        <p className="text-xs text-gray-500">Drag items to the canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <FurnitureCategoryGroup
            key={cat.id}
            category={cat}
            items={FURNITURE.filter((f) => f.category === cat.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FurnitureCategoryGroup({
  category,
  items,
}: {
  category: { id: FurnitureCategory; label: string; icon: string };
  items: FurnitureDefinition[];
}) {
  return (
    <div className="border-b border-gray-100">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-sm">{category.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {category.label}
        </span>
      </div>
      <div className="space-y-0.5 px-3 pb-2">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(item));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex cursor-grab items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 active:cursor-grabbing"
            title={`${item.name} - ${item.width}'×${item.depth}'`}
          >
            <div
              className="h-5 w-5 shrink-0 rounded"
              style={{
                backgroundColor: item.fillColor,
                border: `1.5px solid ${item.color}`,
                borderRadius: item.shape === 'circle' ? '9999px' : '2px',
              }}
            />
            <span className="truncate text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
