ALTER TABLE files 
ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'convert' 
COMMENT '来源: convert / upscale' 
AFTER format;
