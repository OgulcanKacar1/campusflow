'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  KanbanBoardSnapshot,
  KanbanColumn as ColumnType,
  KanbanSprint,
  KanbanTask,
} from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  board: KanbanBoardSnapshot;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  backlogTitle?: string;
  onTaskClick?: (task: KanbanTask) => void;
  onDragEnd?: (result: DropResult) => void;
  /** Sprint header'ını override et (silme butonu vb. için) */
  renderSprintHeader?: (sprint: KanbanSprint, defaultHeader: ReactNode) => ReactNode;
  renderColumnHeader?: (column: ColumnType, sprint: KanbanSprint | null) => ReactNode;
  headerExtra?: ReactNode;
  canMoveTasks?: boolean;
}

function formatDateRange(startAt: string, endAt: string): string {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return 'Tarih bekleniyor';
  }

  const formatter = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  });

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-slate-500/15 text-muted-foreground border-border/40',
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-600/40',
  completed: 'bg-primary/15 text-primary border-primary/40',
  archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-600/40',
};

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  completed: 'Tamamlandı',
  archived: 'Arşiv',
};

export function KanbanBoard({
  board,
  isLoading,
  error,
  className = '',
  backlogTitle = 'Backlog',
  onTaskClick,
  onDragEnd,
  renderSprintHeader,
  renderColumnHeader,
  headerExtra,
  canMoveTasks = true,
}: KanbanBoardProps) {
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (board.sprints.length > 0) {
      setExpandedSprints(prev => {
        // Eğer daha önce state ayarlandıysa (kullanıcı değiştirdiyse) dokunma
        if (Object.keys(prev).length > 0) return prev;
        
        const initialExpanded: Record<string, boolean> = {};
        board.sprints.forEach(sprint => {
          initialExpanded[sprint.id] = sprint.status === 'active';
        });
        
        // Eğer hiçbirisi active değilse, en yakın planning sprintini aç veya ilkini aç.
        if (!Object.values(initialExpanded).includes(true)) {
           const firstPlanning = board.sprints.find(s => s.status === 'planning');
           if (firstPlanning) initialExpanded[firstPlanning.id] = true;
           else if (board.sprints.length > 0) initialExpanded[board.sprints[0].id] = true;
        }
        return initialExpanded;
      });
    }
  }, [board.sprints]);

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId]
    }));
  };

  useEffect(() => {
    console.log('[KANBAN DEBUG] Board snapshot', board);
    board.sprints.forEach(sprint => {
      console.log('[KANBAN DEBUG] Sprint detail', sprint.name, {
        columns: sprint.columns.map(col => ({ status: col.status, tasks: col.tasks.map(task => task.title) })),
      });
    });
  }, [board]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const backlogSection = useMemo(() => {
    const backlogColumns = board.backlogColumns ?? [];
    const backlogCount = backlogColumns.reduce((total, column) => total + column.tasks.length, 0);

    return (
      <section className="rounded-2xl border border-border/60 bg-background/40 p-5">
        {/* Backlog header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-foreground">{backlogTitle}</span>
            <p className="mt-0.5 text-xs text-muted-foreground">Sprint'e atanmamış görevler</p>
          </div>
          <Badge
            variant="outline"
            className="border-border/60 px-2 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {backlogCount} görev
          </Badge>
        </div>

        {/* Backlog kolonları — yatay kaydırma */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {backlogColumns.map(column => (
            <KanbanColumn
              key={`backlog-${column.status}`}
              column={column}
              className="bg-card/30 backdrop-blur-sm w-[300px] shrink-0 snap-start"
              onTaskClick={onTaskClick}
              canMoveTasks={canMoveTasks}
              emptyState={
                <div className="rounded-lg border border-dashed border-border/60 bg-card/50 p-4 text-center text-xs text-muted-foreground">
                  Boş
                </div>
              }
            />
          ))}
        </div>
      </section>
    );
  }, [board.backlogColumns, backlogTitle, onTaskClick]);

  if (!mounted) {
    return <div className={`min-h-[500px] animate-pulse rounded-2xl bg-card/50 ${className ?? ''}`} />;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={`flex flex-col gap-5 ${className ?? ''}`.trim()}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Sprint & Kanban</h2>
          {error && <span className="text-sm text-rose-400">{error}</span>}
          {isLoading && <span className="text-sm text-muted-foreground">Güncelleniyor…</span>}
        </div>
        {headerExtra}
      </div>

      {/* Backlog */}
      {backlogSection}

      {/* Sprintler — alt alta */}
      {board.sprints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Henüz sprint yok.</p>
          <p className="mt-1 text-xs text-muted-foreground">Sprint oluşturarak görevleri organize edin.</p>
        </div>
      ) : (
        board.sprints.map(sprint => {
          const totalTasks = sprint.columns.reduce((sum, col) => sum + col.tasks.length, 0);
          const statusColor = STATUS_COLORS[sprint.status] ?? STATUS_COLORS.planning;
          const statusLabel = STATUS_LABELS[sprint.status] ?? sprint.status;

          const isExpanded = expandedSprints[sprint.id] ?? false;

          const defaultHeader = (
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSprint(sprint.id)}>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                  <h3 className="text-base font-semibold text-foreground select-none hover:text-foreground transition-colors">{sprint.name}</h3>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(sprint.startAt, sprint.endAt)}
                  <span className="mx-1.5 text-slate-700">·</span>
                  {totalTasks} görev
                </p>
              </div>
            </div>
          );

          return (
            <section
              key={sprint.id}
              className="rounded-2xl border border-border/50 bg-card/20 shadow-lg shadow-black/20 p-5"
            >
              {/* Sprint header (override edilebilir) */}
              {renderSprintHeader ? renderSprintHeader(sprint, defaultHeader) : defaultHeader}

              {/* Kolonlar — yatay kaydırma */}
              {isExpanded && (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory animate-in fade-in slide-in-from-top-2 duration-300">
                  {sprint.columns.map(column => (
                    <KanbanColumn
                      key={`${sprint.id}-${column.status}`}
                      sprint={sprint}
                      column={column}
                      className="w-[300px] shrink-0 snap-start"
                      onTaskClick={onTaskClick}
                      canMoveTasks={canMoveTasks}
                      headerExtra={renderColumnHeader?.(column, sprint) ?? null}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
      </div>
    </DragDropContext>
  );
}
