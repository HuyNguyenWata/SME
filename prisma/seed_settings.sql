-- Insert Default Chat Quota Settings
INSERT INTO "Setting" ("key", "value", "description")
VALUES 
    ('GUEST_CHAT_LIMIT', '5', 'Giới hạn số tin nhắn mỗi tháng cho khách vãng lai (Guest)'),
    ('USER_CHAT_LIMIT', '50', 'Giới hạn số tin nhắn mỗi tháng cho người dùng đã đăng nhập'),
    ('AI_CREATE_LIMIT', '5', 'Giới hạn số lần tạo bài đăng social bằng AI mỗi tháng cho User'),
    ('AI_PRODUCT_GENERATE_LIMIT', '5', 'Giới hạn số lần tạo sản phẩm bằng AI mỗi tháng cho User'),
    ('AI_POST_LIMIT', '50', 'Giới hạn số bài viết AI được đăng mỗi tháng')
ON CONFLICT ("key") DO UPDATE 
SET "value" = EXCLUDED."value", "description" = EXCLUDED."description";
