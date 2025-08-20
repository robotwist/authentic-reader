-- Create annotations table if it doesn't exist
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  article_id VARCHAR(255),
  url TEXT,
  title TEXT,
  text TEXT NOT NULL,
  rich_text JSONB DEFAULT NULL,
  type VARCHAR(50) DEFAULT 'highlight',
  tags JSONB DEFAULT '[]'::jsonb,
  sentiment FLOAT DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'private',
  shared_with JSONB DEFAULT '[]'::jsonb,
  reaction_count INT DEFAULT 0,
  collection_id UUID DEFAULT NULL,
  selection JSONB,
  version INT DEFAULT 1,
  parent_id UUID DEFAULT NULL,
  is_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on article_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotations_article_id ON annotations(article_id);

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);

-- Create index on url for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotations_url ON annotations(url);

-- Create index on collection_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotations_collection_id ON annotations(collection_id);

-- Create index on parent_id for faster lookup of replies
CREATE INDEX IF NOT EXISTS idx_annotations_parent_id ON annotations(parent_id);

-- Create reaction table for annotations
CREATE TABLE IF NOT EXISTS annotation_reactions (
  id UUID PRIMARY KEY,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(annotation_id, user_id)
);

-- Create index on annotation_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotation_reactions_annotation_id ON annotation_reactions(annotation_id);

-- Create collections table for organizing annotations
CREATE TABLE IF NOT EXISTS annotation_collections (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotation_collections_user_id ON annotation_collections(user_id);

-- Create table for annotation changes (audit log and versioning)
CREATE TABLE IF NOT EXISTS annotation_versions (
  id UUID PRIMARY KEY,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  rich_text JSONB DEFAULT NULL,
  type VARCHAR(50),
  tags JSONB,
  version INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on annotation_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_annotation_versions_annotation_id ON annotation_versions(annotation_id);

-- Comments on tables and columns for documentation
COMMENT ON TABLE annotations IS 'User annotations for articles';
COMMENT ON COLUMN annotations.id IS 'Unique identifier for the annotation';
COMMENT ON COLUMN annotations.user_id IS 'ID of the user who created the annotation';
COMMENT ON COLUMN annotations.article_id IS 'ID of the article being annotated (optional if URL is provided)';
COMMENT ON COLUMN annotations.url IS 'URL of the article being annotated (optional if article_id is provided)';
COMMENT ON COLUMN annotations.title IS 'Title of the article being annotated';
COMMENT ON COLUMN annotations.text IS 'Text content of the annotation';
COMMENT ON COLUMN annotations.rich_text IS 'Rich text content in JSON format';
COMMENT ON COLUMN annotations.type IS 'Type of annotation (highlight, note, question, insight, correction, etc.)';
COMMENT ON COLUMN annotations.tags IS 'Array of tags associated with the annotation';
COMMENT ON COLUMN annotations.sentiment IS 'Sentiment score of the annotation (-1 to 1)';
COMMENT ON COLUMN annotations.visibility IS 'Visibility setting (private, public, shared)';
COMMENT ON COLUMN annotations.shared_with IS 'Array of user IDs with whom the annotation is shared';
COMMENT ON COLUMN annotations.reaction_count IS 'Total count of reactions to this annotation';
COMMENT ON COLUMN annotations.collection_id IS 'ID of the collection this annotation belongs to';
COMMENT ON COLUMN annotations.selection IS 'JSON object containing text selection data for highlighting';
COMMENT ON COLUMN annotations.version IS 'Current version number of the annotation';
COMMENT ON COLUMN annotations.parent_id IS 'ID of the parent annotation if this is a reply';
COMMENT ON COLUMN annotations.is_reply IS 'Whether this annotation is a reply to another annotation';
COMMENT ON COLUMN annotations.created_at IS 'Timestamp when the annotation was created';
COMMENT ON COLUMN annotations.updated_at IS 'Timestamp when the annotation was last updated';

COMMENT ON TABLE annotation_reactions IS 'User reactions to annotations';
COMMENT ON COLUMN annotation_reactions.id IS 'Unique identifier for the reaction';
COMMENT ON COLUMN annotation_reactions.annotation_id IS 'ID of the annotation being reacted to';
COMMENT ON COLUMN annotation_reactions.user_id IS 'ID of the user who created the reaction';
COMMENT ON COLUMN annotation_reactions.type IS 'Type of reaction (like, agree, disagree, insightful, etc.)';
COMMENT ON COLUMN annotation_reactions.created_at IS 'Timestamp when the reaction was created';

COMMENT ON TABLE annotation_collections IS 'Collections for organizing annotations';
COMMENT ON COLUMN annotation_collections.id IS 'Unique identifier for the collection';
COMMENT ON COLUMN annotation_collections.user_id IS 'ID of the user who created the collection';
COMMENT ON COLUMN annotation_collections.name IS 'Name of the collection';
COMMENT ON COLUMN annotation_collections.description IS 'Description of the collection';
COMMENT ON COLUMN annotation_collections.is_public IS 'Whether the collection is publicly accessible';
COMMENT ON COLUMN annotation_collections.created_at IS 'Timestamp when the collection was created';
COMMENT ON COLUMN annotation_collections.updated_at IS 'Timestamp when the collection was last updated';

COMMENT ON TABLE annotation_versions IS 'Version history for annotations';
COMMENT ON COLUMN annotation_versions.id IS 'Unique identifier for the version entry';
COMMENT ON COLUMN annotation_versions.annotation_id IS 'ID of the annotation';
COMMENT ON COLUMN annotation_versions.user_id IS 'ID of the user who made the change';
COMMENT ON COLUMN annotation_versions.text IS 'Text content at this version';
COMMENT ON COLUMN annotation_versions.rich_text IS 'Rich text content at this version';
COMMENT ON COLUMN annotation_versions.type IS 'Type of annotation at this version';
COMMENT ON COLUMN annotation_versions.tags IS 'Tags at this version';
COMMENT ON COLUMN annotation_versions.version IS 'Version number';
COMMENT ON COLUMN annotation_versions.created_at IS 'Timestamp when this version was created'; 