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
    <div className={`flex min-h-[320px] min-w-[280px] flex-1 flex-col gap-3 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md p-4 shadow-xl shadow-black/20 transition ${className ?? ''}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span>{column.title}</span>
            <Badge variant="outline" className="border-border/70 bg-muted/70 px-2 text-xs text-foreground">
              {column.tasks.length}
            </Badge>
          </div>
          {sprint && (
            <span className="text-xs text-muted-foreground">
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
            className={`flex flex-1 flex-col gap-3 rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10 border-primary/50' : ''}`}
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
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-center text-sm leading-relaxed text-muted-foreground">
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
