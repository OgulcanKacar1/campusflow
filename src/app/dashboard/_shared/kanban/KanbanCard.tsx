'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KANBAN_PRIORITY_LABELS, KANBAN_STATUS_LABELS, type KanbanTask } from '@/types/kanban';

interface KanbanCardProps {
  task: KanbanTask;
  className?: string;
  onClick?: (task: KanbanTask) => void;
  footer?: React.ReactNode;
}

function formatAssignments(count: number): string {
  if (count === 0) return 'Atanmış üye yok';
  if (count === 1) return '1 üye';
  return `${count} üye`;
}

export function KanbanCard({ task, className, onClick, footer }: KanbanCardProps) {
  const assignmentCount = task.assignments.length;
  const handleClick = () => onClick?.(task);

  return (
    <Card
      className={`group cursor-pointer border-slate-700/70 bg-slate-900/80 shadow-sm transition hover:border-indigo-500/70 hover:shadow-lg ${className ?? ''}`.trim()}
      onClick={handleClick}
    >
      <CardHeader className="p-4 pb-2 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium leading-snug text-slate-100 line-clamp-2">
            {task.title}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 border-indigo-500/70 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            {KANBAN_PRIORITY_LABELS[task.priority]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
            {KANBAN_STATUS_LABELS[task.status]}
          </Badge>
          {task.assignedTo && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {task.assignments.find(assignment => assignment.studentId === task.assignedTo)?.fullName ?? 'Sorumlu'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {task.description && (
          <p className="line-clamp-2 text-xs text-slate-400/90 leading-relaxed">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400 font-medium">
          <span>{formatAssignments(assignmentCount)}</span>
          <span>{new Date(task.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
