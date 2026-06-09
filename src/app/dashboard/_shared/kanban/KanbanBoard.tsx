'use client';

import { ReactNode, useEffect, useMemo } from 'react';
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
  /** Sprint header'ını override et (silme butonu vb. için) */
  renderSprintHeader?: (sprint: KanbanSprint, defaultHeader: ReactNode) => ReactNode;
  renderColumnHeader?: (column: ColumnType, sprint: KanbanSprint | null) => ReactNode;
  headerExtra?: ReactNode;
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
  planning: 'bg-slate-500/15 text-slate-300 border-slate-600/40',
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-600/40',
  completed: 'bg-blue-500/15 text-blue-300 border-blue-600/40',
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
  className,
  backlogTitle = 'Backlog',
  onTaskClick,
  renderSprintHeader,
  renderColumnHeader,
  headerExtra,
}: KanbanBoardProps) {
  useEffect(() => {
    console.log('[KANBAN DEBUG] Board snapshot', board);
    board.sprints.forEach(sprint => {
      console.log('[KANBAN DEBUG] Sprint detail', sprint.name, {
        columns: sprint.columns.map(col => ({ status: col.status, tasks: col.tasks.map(task => task.title) })),
      });
    });
  }, [board]);

  const backlogSection = useMemo(() => {
    const backlogColumns = board.backlogColumns ?? [];
    const backlogCount = backlogColumns.reduce((total, column) => total + column.tasks.length, 0);

    return (
      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5">
        {/* Backlog header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-100">{backlogTitle}</span>
            <p className="mt-0.5 text-xs text-slate-500">Sprint'e atanmamış görevler</p>
          </div>
          <Badge
            variant="outline"
            className="border-slate-700/60 px-2 text-xs text-slate-300"
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
              className="bg-slate-900/40 w-[300px] shrink-0 snap-start"
              onTaskClick={onTaskClick}
              emptyState={
                <div className="rounded-lg border border-dashed border-slate-700/60 bg-slate-900/50 p-4 text-center text-xs text-slate-500">
                  Boş
                </div>
              }
            />
          ))}
        </div>
      </section>
    );
  }, [board.backlogColumns, backlogTitle, onTaskClick]);

  return (
    <div className={`flex flex-col gap-5 ${className ?? ''}`.trim()}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-100">Sprint & Kanban</h2>
          {error && <span className="text-sm text-rose-400">{error}</span>}
          {isLoading && <span className="text-sm text-slate-400">Güncelleniyor…</span>}
        </div>
        {headerExtra}
      </div>

      {/* Backlog */}
      {backlogSection}

      {/* Sprintler — alt alta */}
      {board.sprints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center">
          <p className="text-sm text-slate-500">Henüz sprint yok.</p>
          <p className="mt-1 text-xs text-slate-600">Sprint oluşturarak görevleri organize edin.</p>
        </div>
      ) : (
        board.sprints.map(sprint => {
          const totalTasks = sprint.columns.reduce((sum, col) => sum + col.tasks.length, 0);
          const statusColor = STATUS_COLORS[sprint.status] ?? STATUS_COLORS.planning;
          const statusLabel = STATUS_LABELS[sprint.status] ?? sprint.status;

          const defaultHeader = (
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-100">{sprint.name}</h3>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
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
              className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-5"
            >
              {/* Sprint header (override edilebilir) */}
              {renderSprintHeader ? renderSprintHeader(sprint, defaultHeader) : defaultHeader}

              {/* Kolonlar — yatay kaydırma */}
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {sprint.columns.map(column => (
                  <KanbanColumn
                    key={`${sprint.id}-${column.status}`}
                    sprint={sprint}
                    column={column}
                    className="w-[300px] shrink-0 snap-start"
                    onTaskClick={onTaskClick}
                    headerExtra={renderColumnHeader?.(column, sprint) ?? null}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
