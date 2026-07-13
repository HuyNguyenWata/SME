-- Insert Customer 1 (Fake Data)
INSERT INTO "Customer" ("store_id", "email", "password", "name", "phone", "address", "is_active", "created_at", "updated_at")
VALUES (
    4, 
    'olivia.williams@example.com', 
    '$2b$10$EpD6oH3.s/C9R0JgX5v7..a8yL0s0Z8x1bO0/3eZ9Gz/fM2Z5u16O', -- password: password123
    'Olivia Williams', 
    '+84901234567', 
    '123 Nguyen Hue, District 1, Ho Chi Minh City, Vietnam', 
    true, 
    NOW(), 
    NOW()
);

-- Insert Customer 2 (Fake Data)
INSERT INTO "Customer" ("store_id", "email", "password", "name", "phone", "address", "is_active", "created_at", "updated_at")
VALUES (
    4, 
    'ethan.brown@example.com', 
    '$2b$10$EpD6oH3.s/C9R0JgX5v7..a8yL0s0Z8x1bO0/3eZ9Gz/fM2Z5u16O', -- password: password123
    'Ethan Brown', 
    '+84987654321', 
    '456 Le Loi, District 1, Ho Chi Minh City, Vietnam', 
    true, 
    NOW(), 
    NOW()
);
