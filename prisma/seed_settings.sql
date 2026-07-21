-- Insert Default Chat Quota Settings
INSERT INTO "Setting" ("key", "value", "description")
VALUES 
    ('GUEST_CHAT_LIMIT', '5', 'Giới hạn số tin nhắn mỗi tháng cho khách vãng lai (Guest)'),
    ('USER_CHAT_LIMIT', '50', 'Giới hạn số tin nhắn mỗi tháng cho người dùng đã đăng nhập'),
    ('AI_CREATE_LIMIT', '5', 'Giới hạn số lần tạo bài đăng social bằng AI mỗi tháng cho User'),
    ('AI_PRODUCT_GENERATE_LIMIT', '5', 'Giới hạn số lần tạo sản phẩm bằng AI mỗi tháng cho User'),
    ('AI_POST_LIMIT', '50', 'Giới hạn số bài viết AI được đăng mỗi tháng'),
    ('NEWS_API_KEY', 'your_news_api_key_here', 'API Key cho dịch vụ News API'),
    ('NEWS_RUN_INTERVAL', '2', 'Chu kỳ chạy (giờ) cho News API'),
    ('NEWS_POST_COUNT', '1', 'Số bài muốn tạo mỗi chu kỳ'),
    ('NEWS_IMAGE_COUNT', '1', 'Số lượng hình ảnh yêu cầu mỗi bài')
ON CONFLICT ("key") DO UPDATE 
SET "value" = EXCLUDED."value", "description" = EXCLUDED."description";
