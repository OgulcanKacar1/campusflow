'use client';

import { useCallback, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { KanbanBoardSnapshot } from '@/types/kanban';
import { useKanbanState } from './hooks/useKanbanState';
import { KanbanBoard } from './KanbanBoard';

interface StudentKanbanClientProps {
  teamId: string;
  teamName: string;
  courseName: string;
  initialSnapshot: KanbanBoardSnapshot;
  initialError?: string | null;
}

export function StudentKanbanClient({
  teamId,
  teamName,
  courseName,
  initialSnapshot,
  initialError,
}: StudentKanbanClientProps) {
  const [message, setMessage] = useState<string | null>(initialError ?? null);

  const { board, isRefreshing, isMutating, actions } = useKanbanState({
    teamId,
    initialSnapshot,
    onError: (msg) => setMessage(msg),
  });

  const handleRefresh = useCallback(() => {
    setMessage(null);
    void actions.refresh();
  }, [actions]);

  const isBusy = isRefreshing || isMutating;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Takım Panosu</p>
          <h2 className="text-xl font-semibold text-white">
            {courseName}
            <span className="ml-2 text-sm font-normal text-white/50">/ {teamName}</span>
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 text-white/70 hover:text-white"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Yenile
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
          {message}
        </div>
      )}

      <KanbanBoard
        board={board}
        isLoading={isBusy}
        error={message}
        className="border-none bg-transparent p-0"
      />
    </div>
  );
}
