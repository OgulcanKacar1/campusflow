-- 0002_rls_policies.sql
-- Row Level Security (RLS) Rules for CampusFlow

-- =========================================================================================
-- 1. TABLOLARIN RLS ÖZELLİĞİNİ AKTİF ETME (DEFAULT DENY ALL)
-- =========================================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- =========================================================================================
-- 2. PROFİLLER (profiles)
-- =========================================================================================
-- Herkes birbirinin profilini okuyabilir (takım arkadaşlarını görmek için gerekli)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

-- Kullanıcı sadece kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- =========================================================================================
-- 3. DERSLER (courses)
-- =========================================================================================
-- Herkes aktif dersleri görebilir (zaten view var ama tablodan da select açık olmalı)
CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);

-- Sadece rolu 'instructor' olanlar ders açabilir
CREATE POLICY "courses_insert_instructor" ON courses FOR INSERT WITH CHECK (
  instructor_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor')
);

-- Sadece dersin sahibi güncelleyebilir veya silebilir
CREATE POLICY "courses_update_owner" ON courses FOR UPDATE USING (instructor_id = auth.uid()) WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "courses_delete_owner" ON courses FOR DELETE USING (instructor_id = auth.uid());


-- =========================================================================================
-- 4. DERSE KAYIT (course_enrollments)
-- =========================================================================================
-- Sadece o derse kayıtlı olanlar veya o dersin hocası görebilir
CREATE POLICY "enrollments_select_enrolled" ON course_enrollments FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM course_enrollments ce2 WHERE ce2.course_id = course_id AND ce2.student_id = auth.uid())
);

-- Öğrenci kendini ekleyebilir (Link ile kayıt senaryosu)
CREATE POLICY "enrollment_insert_student" ON course_enrollments FOR INSERT WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'student'
  )
);

-- Hoca herkesi ekleyebilir (CSV yükleme senaryosu)
CREATE POLICY "enrollment_insert_instructor" ON course_enrollments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE id = course_id AND instructor_id = auth.uid()
  )
);

-- Sadece hoca güncelleyebilir (drop vb.) veya silebilir
CREATE POLICY "enrollment_update_instructor" ON course_enrollments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "enrollment_delete_instructor" ON course_enrollments FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);


-- =========================================================================================
-- 5. TAKIMLAR (teams)
-- =========================================================================================
-- Herkes takımları görebilir
CREATE POLICY "teams_select_all" ON teams FOR SELECT USING (true);

-- Sadece o derse kayıtlı olan öğrenciler veya dersin hocası takım oluşturabilir
CREATE POLICY "teams_insert_auth" ON teams FOR INSERT WITH CHECK (
  created_by = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_id = teams.course_id
      AND student_id = auth.uid()
      AND status = 'enrolled'
    )
    OR
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = teams.course_id AND instructor_id = auth.uid()
    )
  )
);

-- Sadece dersin hocası veya takımı kuran güncelleyebilir
CREATE POLICY "teams_update_owner_or_instructor" ON teams FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- Sadece dersin hocası takımı silebilir
CREATE POLICY "teams_delete_instructor" ON teams FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);


-- =========================================================================================
-- 6. TAKIM ÜYELERİ (team_members)
-- =========================================================================================
-- Herkes takım üyelerini görebilir
CREATE POLICY "team_members_select_all" ON team_members FOR SELECT USING (true);

-- Derse kayıtlı olanlar kendilerini bir takıma ekleyebilir / hocalar ekleyebilir
CREATE POLICY "team_members_insert_auth" ON team_members FOR INSERT WITH CHECK (
  -- Öğrenci sadece kendini ekleyebilir, o derste kayıtlı olmalı
  (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      JOIN teams t ON t.course_id = ce.course_id
      WHERE t.id = team_id
      AND ce.student_id = auth.uid()
      AND ce.status = 'enrolled'
    )
  )
  OR
  -- Hoca herkesi ekleyebilir
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = team_id AND c.instructor_id = auth.uid()
  )
);

-- Güncelleme/Silme: Sadece öğrencinin kendisi veya dersin hocası yapabilir
CREATE POLICY "team_members_update_auth" ON team_members FOR UPDATE USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM teams t JOIN courses c ON c.id = t.course_id WHERE t.id = team_id AND c.instructor_id = auth.uid())
);

CREATE POLICY "team_members_delete_auth" ON team_members FOR DELETE USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM teams t JOIN courses c ON c.id = t.course_id WHERE t.id = team_id AND c.instructor_id = auth.uid())
);


-- =========================================================================================
-- 7. SPRINTS (sprints)
-- =========================================================================================
CREATE POLICY "sprints_select_all" ON sprints FOR SELECT USING (true);

-- Takım üyesi veya hoca yazıp silebilir
CREATE POLICY "sprints_all_auth" ON sprints FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE team_id = sprints.team_id AND student_id = auth.uid() AND left_at IS NULL) OR
  EXISTS (SELECT 1 FROM courses JOIN teams ON teams.course_id = courses.id WHERE teams.id = sprints.team_id AND instructor_id = auth.uid())
);


-- =========================================================================================
-- 8. GÖREVLER (tasks)
-- =========================================================================================
CREATE POLICY "tasks_select_all" ON tasks FOR SELECT USING (true);

-- Takım üyesi veya hoca görev açıp değiştirebilir
CREATE POLICY "tasks_all_auth" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE team_id = tasks.team_id AND student_id = auth.uid() AND left_at IS NULL) OR
  EXISTS (SELECT 1 FROM courses JOIN teams ON teams.course_id = courses.id WHERE teams.id = tasks.team_id AND instructor_id = auth.uid())
);


-- =========================================================================================
-- 9. DUYURULAR (announcements) VE TAKVİM (calendar_events)
-- =========================================================================================
CREATE POLICY "announcements_select_all" ON announcements FOR SELECT USING (true);
-- Sadece hoca duyuru ekleyebilir, güncelleyebilir veya silebilir
CREATE POLICY "announcements_insert_instructor" ON announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "announcements_update_instructor" ON announcements FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
CREATE POLICY "announcements_delete_instructor" ON announcements FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "calendar_select_all" ON calendar_events FOR SELECT USING (true);
-- Hoca VEYA takım üyesi etkinlik oluşturabilir
CREATE POLICY "calendar_all_instructor" ON calendar_events FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid()) OR
  (team_id IS NOT NULL AND EXISTS (SELECT 1 FROM team_members WHERE team_id = calendar_events.team_id AND student_id = auth.uid() AND left_at IS NULL))
);


-- =========================================================================================
-- 10. AI TABLOLARI (ai_analyses & grade_suggestions) - KRİTİK GÜVENLİK
-- =========================================================================================
-- AI_ANALYSES: Öğrenciler KESİNLİKLE GÖREMEZ. Sadece dersin Hocası görebilir.
CREATE POLICY "ai_analyses_select_instructor" ON ai_analyses FOR SELECT USING (
  EXISTS (SELECT 1 FROM teams JOIN courses ON courses.id = teams.course_id WHERE teams.id = team_id AND courses.instructor_id = auth.uid())
);
-- İstemciden INSERT/UPDATE KAPALI. Server yazar.

-- GRADE_SUGGESTIONS: Öğrenci sadece "kendisine" ait skoru görebilir. Hoca herkesi görebilir.
CREATE POLICY "grade_select_student_or_instructor" ON grade_suggestions FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND instructor_id = auth.uid())
);
-- İstemciden INSERT/UPDATE KAPALI. Server yazar.


-- =========================================================================================
-- 11. ENTEGRASYON VE WEBHOOK (task_integrations, integration_events, webhook_queue)
-- =========================================================================================
CREATE POLICY "task_integrations_select" ON task_integrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks t JOIN team_members tm ON tm.team_id = t.team_id WHERE t.id = task_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL) OR
  EXISTS (SELECT 1 FROM tasks t JOIN teams on teams.id = t.team_id JOIN courses c ON c.id = teams.course_id WHERE t.id = task_id AND c.instructor_id = auth.uid())
);

CREATE POLICY "integration_events_select" ON integration_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM task_integrations ti JOIN tasks t ON t.id = ti.task_id JOIN team_members tm ON tm.team_id = t.team_id WHERE ti.id = integration_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL) OR
  EXISTS (SELECT 1 FROM task_integrations ti JOIN tasks t ON t.id = ti.task_id JOIN teams on teams.id = t.team_id JOIN courses c ON c.id = teams.course_id WHERE ti.id = integration_id AND c.instructor_id = auth.uid())
);
-- INSERT/UPDATE KAPALI. Server webhookları dinleyip service_role ile yazar.
-- webhook_queue sadece service_role erişebilir, istemciye tamamen kapalıdır.
-- RLS aktif + policy yok = istemci erişimi engellendi (bu kasıtlı bir kurgudur).


-- =========================================================================================
-- 12. BİLDİRİMLER (notifications)
-- =========================================================================================
-- Sadece kendine gelen bildirimleri okuyabilir
CREATE POLICY "notifications_select_self" ON notifications FOR SELECT USING (user_id = auth.uid());

-- Sadece kendi bildirimini 'okundu' olarak işaretleyebilir
CREATE POLICY "notifications_update_self" ON notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- İstemciden Bildirim oluşturulamaz. Server atar.
