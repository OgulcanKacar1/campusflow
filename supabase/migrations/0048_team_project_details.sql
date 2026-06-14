-- Migration: 0048_team_project_details
-- Açıklama: Takımların üzerinde çalıştığı projenin detaylarını tutan sütunlar (Yapay Zeka Analizi bağlamı için).

ALTER TABLE teams
ADD COLUMN project_name TEXT,
ADD COLUMN project_description TEXT;
