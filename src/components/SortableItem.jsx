import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableItem({ id, content, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`code-block ${isDragging ? 'is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="drag-handle" title="Drag to reorder">
        <GripVertical size={16} />
      </div>
      <span className="line-num">{index + 1}</span>
      <code className="code-text">{content || ' '}</code>
    </div>
  );
}
