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
      className={`group cursor-pointer border-border/50 bg-card/50 backdrop-blur-md shadow-sm transition hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 ${className ?? ''}`.trim()}
      onClick={handleClick}
    >
      <CardHeader className="p-4 pb-2 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium leading-snug text-foreground line-clamp-2">
            {task.short_id && <span className="text-primary mr-1.5 font-bold">[{task.short_id}]</span>}
            {task.title}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {KANBAN_PRIORITY_LABELS[task.priority]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-muted/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {KANBAN_STATUS_LABELS[task.status]}
          </Badge>
          {task.assignments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.assignments.slice(0, 2).map((assignment) => (
                <span key={assignment.studentId} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  {assignment.fullName?.split(' ')[0] ?? assignment.email?.split('@')[0] ?? 'Üye'}
                </span>
              ))}
              {task.assignments.length > 2 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{task.assignments.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground/90 leading-relaxed">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground font-medium">
          <span>{formatAssignments(assignmentCount)}</span>
          <span>{new Date(task.updatedAt).toLocaleDateString('tr-TR')}</span>
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
