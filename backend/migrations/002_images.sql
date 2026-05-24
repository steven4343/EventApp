CREATE TABLE IF NOT EXISTS images (
  id VARCHAR(50) PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  image_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id);
