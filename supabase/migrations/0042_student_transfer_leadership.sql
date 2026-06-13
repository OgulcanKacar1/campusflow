-- Migration 0042: Student transfer leadership RPC

CREATE OR REPLACE FUNCTION student_transfer_leadership(
    p_team_id UUID,
    p_target_student_id UUID
) RETURNS void AS $$
DECLARE
    v_current_user_id UUID;
    v_is_leader BOOLEAN;
    v_is_target_in_team BOOLEAN;
BEGIN
    v_current_user_id := auth.uid();
    
    -- Check if current user is leader of this team
    SELECT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = p_team_id 
        AND student_id = v_current_user_id 
        AND role = 'leader' 
        AND left_at IS NULL
    ) INTO v_is_leader;
    
    IF NOT v_is_leader THEN
        RAISE EXCEPTION 'Bu işlem için takım lideri olmalısınız';
    END IF;

    -- Check if target user is in this team
    SELECT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = p_team_id 
        AND student_id = p_target_student_id 
        AND left_at IS NULL
    ) INTO v_is_target_in_team;

    IF NOT v_is_target_in_team THEN
        RAISE EXCEPTION 'Hedef kullanıcı bu takımda değil';
    END IF;

    -- Update roles
    UPDATE team_members SET role = 'member' WHERE team_id = p_team_id AND student_id = v_current_user_id;
    UPDATE team_members SET role = 'leader' WHERE team_id = p_team_id AND student_id = p_target_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
