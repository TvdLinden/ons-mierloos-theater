-- Reset focal_points data: contexts have been renamed to aspect ratios (16:7, 4:3, 21:9, 16:9)
-- Old keys (hero, card, carousel, thumbnail, gallery) are no longer valid
UPDATE images SET focal_points = NULL WHERE focal_points IS NOT NULL;
