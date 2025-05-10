-- Add version_history table for annotations
CREATE TABLE IF NOT EXISTS annotation_versions (
  id SERIAL PRIMARY KEY,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  version INT NOT NULL,
  text TEXT NOT NULL,
  rich_text TEXT,
  tags TEXT[],
  bias_tags JSONB,
  rhetorical_tags JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255), -- Using string to avoid foreign key issues
  change_summary TEXT
);

-- Add collaboration_logs table for activity tracking
CREATE TABLE IF NOT EXISTS collaboration_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255), -- Using string to avoid foreign key issues
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add table for real-time cursor positions (ephemeral data)
CREATE TABLE IF NOT EXISTS active_collaborators (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  article_id UUID,
  socket_id VARCHAR(50) NOT NULL,
  cursor_position JSONB,
  selection JSONB,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add table for annotation locks
CREATE TABLE IF NOT EXISTS annotation_locks (
  annotation_id UUID PRIMARY KEY REFERENCES annotations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Simple function to create version history entries
CREATE OR REPLACE FUNCTION create_annotation_version()
RETURNS TRIGGER AS $$
DECLARE
  current_version INT;
BEGIN
  -- Get the highest current version number or default to 0
  SELECT COALESCE(MAX(version), 0) INTO current_version
  FROM annotation_versions
  WHERE annotation_id = NEW.id;
  
  -- Insert the new version
  INSERT INTO annotation_versions(
    annotation_id, 
    version, 
    text,
    updated_at,
    updated_by,
    change_summary
  ) VALUES (
    NEW.id,
    current_version + 1,
    NEW.text,
    NEW.updated_at,
    NEW.user_id,
    'Update via trigger'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for text changes only
CREATE TRIGGER annotation_version_trigger
AFTER UPDATE ON annotations
FOR EACH ROW
WHEN (OLD.text IS DISTINCT FROM NEW.text)
EXECUTE FUNCTION create_annotation_version();

-- Add function to automatically delete expired locks
CREATE OR REPLACE FUNCTION delete_expired_locks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM annotation_locks
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up expired locks
CREATE TRIGGER cleanup_expired_locks
AFTER INSERT OR UPDATE ON annotation_locks
EXECUTE FUNCTION delete_expired_locks();

-- Add indexes for performance
CREATE INDEX idx_annotation_versions_annotation_id ON annotation_versions(annotation_id);
CREATE INDEX idx_collaboration_logs_annotation_id ON collaboration_logs(annotation_id);
CREATE INDEX idx_collaboration_logs_user_id ON collaboration_logs(user_id);
CREATE INDEX idx_active_collaborators_article_id ON active_collaborators(article_id);
CREATE INDEX idx_active_collaborators_user_id ON active_collaborators(user_id); 