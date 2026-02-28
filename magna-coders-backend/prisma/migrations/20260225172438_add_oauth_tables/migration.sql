-- DropIndex
DROP INDEX "public"."idx_posts_content_trgm";

-- DropIndex
DROP INDEX "public"."idx_posts_title_trgm";

-- DropIndex
DROP INDEX "public"."idx_projects_owner_id";

-- DropIndex
DROP INDEX "public"."idx_projects_status";

-- RenameIndex
ALTER INDEX "idx_opportunities_job_type" RENAME TO "opportunities_job_type_idx";

-- RenameIndex
ALTER INDEX "idx_opportunities_location" RENAME TO "opportunities_location_idx";

-- RenameIndex
ALTER INDEX "idx_post_tags_post_id" RENAME TO "post_tags_post_id_idx";

-- RenameIndex
ALTER INDEX "idx_post_tags_tag_id" RENAME TO "post_tags_tag_id_idx";

-- RenameIndex
ALTER INDEX "idx_posts_created_at" RENAME TO "posts_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_user_roles_user_id" RENAME TO "user_roles_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_user_skills_skill_id" RENAME TO "user_skills_skill_id_idx";

-- RenameIndex
ALTER INDEX "idx_user_skills_user_id" RENAME TO "user_skills_user_id_idx";
