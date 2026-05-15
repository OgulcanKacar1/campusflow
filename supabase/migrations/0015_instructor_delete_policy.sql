-- 0015_instructor_delete_policy.sql
-- Hocaların kendi açtıkları dersleri silebilmesi için RLS kuralı ekler.

CREATE POLICY "Instructors can delete their own courses" 
ON public.courses FOR DELETE 
USING (
  get_my_role() = 'instructor' 
  AND instructor_id = auth.uid()
);
