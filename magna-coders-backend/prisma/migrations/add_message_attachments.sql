-- Add file attachment fields to messages table
ALTER TABLE messages 
ADD COLUMN message_type VARCHAR(20) DEFAULT 'TEXT',
ADD COLUMN file_url TEXT,
ADD COLUMN file_name VARCHAR(255),
ADD COLUMN file_size INTEGER,
ADD COLUMN file_type VARCHAR(100);

-- Add index for message type for faster queries
CREATE INDEX idx_messages_type ON messages(message_type);

-- Add check constraint for message type
ALTER TABLE messages 
ADD CONSTRAINT chk_message_type 
CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'VOICE'));
