import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string | null) {
  if (!WEBHOOK_SECRET || !signature) return true; // Geliştirme ortamında veya secret tanımlı değilse geçerli say

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (e) {
    return false;
  }
}

function extractTaskIds(text: string): string[] {
  if (!text) return [];
  const regex = /T-(\d+)/gi;
  const matches = [...text.matchAll(regex)];
  return [...new Set(matches.map((m) => `T-${m[1].toUpperCase()}`))];
}

import { createNotification } from "@/app/dashboard/shared/notification-actions";

async function notifyTeam(
  supabase: any,
  teamId: string,
  courseId: string,
  teamName: string,
  targetStatus: string,
  taskShortId: string,
  taskTitle: string,
  taskId: string,
) {
  const { data: course } = await supabase
    .from("courses")
    .select("code")
    .eq("id", courseId)
    .single();
  const courseCode = course?.code || "Ders";
  const contextTitle = `[${courseCode} - ${teamName}]`;
  const content = `${contextTitle} '${taskShortId} ${taskTitle}' görevinin durumu '${targetStatus}' oldu.`;

  const { data: members } = await supabase
    .from("team_members")
    .select("student_id")
    .eq("team_id", teamId)
    .is("left_at", null);
  if (!members) return;

  for (const m of members) {
    await createNotification({
      userId: m.student_id,
      title: "Görev Durumu Güncellendi",
      content: content,
      type: "task_status",
      entityType: "task",
      entityId: taskId,
    });
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const eventType = request.headers.get("x-github-event");
    const payloadString = await request.text();
    const { searchParams } = new URL(request.url);
    const urlTeamId = searchParams.get("teamId");

    if (WEBHOOK_SECRET && !verifySignature(payloadString, signature)) {
      console.error("Invalid GitHub webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(payloadString);
    const repoUrl = payload.repository?.html_url || payload.repository?.url;

    if (!repoUrl) {
      return NextResponse.json(
        { message: "No repository URL found in payload" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    let team = null;

    if (urlTeamId) {
      const { data } = await supabase
        .from("teams")
        .select("id, name, course_id")
        .eq("id", urlTeamId)
        .single();
      team = data;
    } else {
      const { data } = await supabase
        .from("teams")
        .select("id, name, course_id")
        .ilike("repo_url", `${repoUrl}%`)
        .single();
      team = data;
    }

    if (!team) {
      console.log(`No team found for repo: ${repoUrl} or teamId: ${urlTeamId}`);
      return NextResponse.json(
        { message: "Repo not linked to any team" },
        { status: 200 },
      );
    }

    const updatedTasks: { id: string; title: string; newStatus: string }[] = [];

    if (eventType === "push") {
      const commits = payload.commits || [];
      const branch = payload.ref?.replace("refs/heads/", "");
      const pusherName =
        payload.pusher?.name || payload.sender?.login || "Bir geliştirici";

      for (const commit of commits) {
        const message = commit.message || "";
        const shortIds = extractTaskIds(message);

        if (shortIds.length === 0) continue;

        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, status, short_id")
          .eq("team_id", team.id)
          .in("short_id", shortIds);

        if (!tasks || tasks.length === 0) continue;

        for (const task of tasks) {
          await supabase.from("task_github_events").insert({
            task_id: task.id,
            event_type: "commit",
            commit_hash: commit.id,
            author_username:
              commit.author?.username || commit.author?.name || pusherName,
            author_name: commit.author?.name || pusherName,
            message: commit.message,
            url: commit.url,
            payload: commit,
          });

          if (task.status === "todo") {
            await supabase
              .from("tasks")
              .update({
                status: "in_progress",
                updated_at: new Date().toISOString(),
              })
              .eq("id", task.id);

            updatedTasks.push({
              id: task.id,
              title: task.title,
              newStatus: "in_progress",
            });

            await notifyTeam(
              supabase,
              team.id,
              team.course_id,
              team.name,
              "in_progress",
              task.short_id,
              task.title,
              task.id,
            );
          }
        }
      }
    } else if (eventType === "pull_request") {
      const pr = payload.pull_request;
      const action = payload.action;
      const prTitle = pr.title || "";
      const prBody = pr.body || "";
      const senderName = payload.sender?.login || "Bir geliştirici";

      const combinedText = `${prTitle} ${prBody}`;
      const shortIds = extractTaskIds(combinedText);

      if (shortIds.length > 0) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, status, short_id")
          .eq("team_id", team.id)
          .in("short_id", shortIds);

        if (tasks && tasks.length > 0) {
          for (const task of tasks) {
            let newStatus = null;
            let notifMessage = "";

            let prEventType = "pr_opened";
            if (action === "closed" && pr.merged) prEventType = "pr_merged";
            else if (action === "synchronize") prEventType = "pr_updated";

            if (
              ["opened", "reopened", "closed", "synchronize"].includes(action)
            ) {
              await supabase.from("task_github_events").insert({
                task_id: task.id,
                event_type: prEventType,
                pr_number: pr.number,
                author_username: pr.user?.login || senderName,
                author_name: senderName,
                message: prTitle,
                url: pr.html_url,
                payload: pr,
              });
            }

            if (
              action === "opened" ||
              action === "reopened" ||
              action === "edited" ||
              action === "synchronize"
            ) {
              if (task.status !== "review" && task.status !== "done") {
                newStatus = "review";
                notifMessage = `GitHub'da PR güncellendi. '${task.title}' görevi 'İnceleme' aşamasına alındı.`;
              }
            } else if (action === "closed" && pr.merged) {
              if (task.status !== "done") {
                newStatus = "done";
                notifMessage = `GitHub'da PR merge edildi! '${task.title}' görevi 'Tamamlandı' olarak işaretlendi.`;
              }
            }

            if (newStatus) {
              await supabase
                .from("tasks")
                .update({
                  status: newStatus,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", task.id);
              updatedTasks.push({ id: task.id, title: task.title, newStatus });
              await notifyTeam(
                supabase,
                team.id,
                team.course_id,
                team.name,
                newStatus,
                task.short_id,
                task.title,
                task.id,
              );
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed",
      updatedTasks,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
