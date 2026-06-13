'use client';

import { Fragment, ReactNode } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import type { KanbanColumn as ColumnType, KanbanSprint, KanbanTask } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: ColumnType;
  sprint?: KanbanSprint;
  className?: string;
  onTaskClick?: (task: KanbanTask) => void;
  headerExtra?: ReactNode;
  emptyState?: ReactNode;
  canMoveTasks?: boolean;
}

export function KanbanColumn({ column, sprint, className, onTaskClick, headerExtra, emptyState, canMoveTasks = true }: KanbanColumnProps) {
  const tasks = column.tasks ?? [];
  const hasTasks = tasks.length > 0;

  return (
    <div className={`flex min-h-[320px] min-w-[280px] flex-1 flex-col gap-3 rounded-xl border border-slate-700/70 bg-[#101b2d] p-4 shadow-lg shadow-slate-950/30 transition ${className ?? ''}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span>{column.title}</span>
            <Badge variant="outline" className="border-slate-600/70 bg-slate-800/70 px-2 text-xs text-slate-100">
              {column.tasks.length}
            </Badge>
          </div>
          {sprint && (
            <span className="text-xs text-slate-500">
              {sprint.name}
            </span>
          )}
        </div>
        {headerExtra}
      </div>

      <Droppable droppableId={`${sprint?.id ?? 'backlog'}::${column.status}`}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex flex-1 flex-col gap-3 rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/10 border-indigo-500/50' : ''}`}
          >
            {hasTasks ? (
              tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canMoveTasks}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={snapshot.isDragging ? 'opacity-90 scale-[1.02] shadow-2xl z-50' : ''}
                    >
                      <KanbanCard task={task} onClick={onTaskClick} />
                    </div>
                  )}
                </Draggable>
              ))
            ) : (
              emptyState ?? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-700/60 bg-[#0f1523] px-4 py-6 text-center text-sm leading-relaxed text-slate-300">
                  Bu sütunda görev yok.
                </div>
              )
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
