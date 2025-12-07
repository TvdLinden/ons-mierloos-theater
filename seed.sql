-- ============================================
-- Theater Database Seed Script
-- Seeds 40+ shows with performances and tags
-- ============================================

-- Clear existing data (in reverse order of foreign key dependencies)
DELETE FROM show_tags;
DELETE FROM performances;
DELETE FROM shows;
DELETE FROM tags;
-- Note: Images are inserted by seed-database.mjs (not deleted to preserve image data)

-- ============================================
-- Insert Tags
-- ============================================
INSERT INTO tags (id, name, slug, description, created_at) VALUES
  (gen_random_uuid(), 'Drama', 'drama', 'Dramatic theater performances', NOW()),
  (gen_random_uuid(), 'Comedy', 'comedy', 'Comedic and humorous performances', NOW()),
  (gen_random_uuid(), 'Musical', 'musical', 'Musical theater and song-based performances', NOW()),
  (gen_random_uuid(), 'Dance', 'dance', 'Dance performances and choreography', NOW()),
  (gen_random_uuid(), 'Kids', 'kids', 'Family-friendly performances for children', NOW()),
  (gen_random_uuid(), 'Contemporary', 'contemporary', 'Contemporary and experimental theater', NOW()),
  (gen_random_uuid(), 'Shakespeare', 'shakespeare', 'Classical Shakespeare productions', NOW()),
  (gen_random_uuid(), 'Improv', 'improv', 'Improvisational theater', NOW()),
  (gen_random_uuid(), 'Stand-up', 'stand-up', 'Stand-up comedy and monologues', NOW()),
  (gen_random_uuid(), 'World Theater', 'world-theater', 'Theater from around the world', NOW());

-- ============================================
-- Insert Shows (40+ entries)
-- ============================================
WITH image_map AS (
  SELECT DISTINCT ON (filename) id, filename 
  FROM images 
  ORDER BY filename, id
),
show_images AS (
  SELECT 
    'hamlet-main.jpg' as main_filename,
    'hamlet-thumb.jpg' as thumb_filename,
    'Hamlet: A Tragedy Revisited' as show_title
  UNION ALL
  SELECT 'glass-menagerie-main.jpg', 'glass-menagerie-thumb.jpg', 'The Glass Menagerie'
  UNION ALL
  SELECT 'ghosts-main.jpg', 'ghosts-thumb.jpg', 'Ghosts'
  UNION ALL
  SELECT 'dolls-house-main.jpg', 'dolls-house-thumb.jpg', 'A Doll''s House'
  UNION ALL
  SELECT 'crucible-main.jpg', 'crucible-thumb.jpg', 'The Crucible'
  UNION ALL
  SELECT 'importance-earnest-main.jpg', 'importance-earnest-thumb.jpg', 'The Importance of Being Earnest'
  UNION ALL
  SELECT 'much-ado-main.jpg', 'much-ado-thumb.jpg', 'Much Ado About Nothing'
  UNION ALL
  SELECT 'twelfth-night-main.jpg', 'twelfth-night-thumb.jpg', 'Twelfth Night'
  UNION ALL
  SELECT 'noises-off-main.jpg', 'noises-off-thumb.jpg', 'Noises Off'
  UNION ALL
  SELECT 'one-liners-main.jpg', 'one-liners-thumb.jpg', 'One-Liners and Laughter'
  UNION ALL
  SELECT 'les-miserables-main.jpg', 'les-miserables-thumb.jpg', 'Les Misérables'
  UNION ALL
  SELECT 'phantom-opera-main.jpg', 'phantom-opera-thumb.jpg', 'The Phantom of the Opera'
  UNION ALL
  SELECT 'evita-main.jpg', 'evita-thumb.jpg', 'Evita'
  UNION ALL
  SELECT 'west-side-story-main.jpg', 'west-side-story-thumb.jpg', 'West Side Story'
  UNION ALL
  SELECT 'sweeney-todd-main.jpg', 'sweeney-todd-thumb.jpg', 'Sweeney Todd'
  UNION ALL
  SELECT 'swan-lake-main.jpg', 'swan-lake-thumb.jpg', 'Swan Lake'
  UNION ALL
  SELECT 'nutcracker-main.jpg', 'nutcracker-thumb.jpg', 'The Nutcracker'
  UNION ALL
  SELECT 'giselle-main.jpg', 'giselle-thumb.jpg', 'Giselle'
  UNION ALL
  SELECT 'contemporary-fusion-main.jpg', 'contemporary-fusion-thumb.jpg', 'Contemporary Dance Fusion'
  UNION ALL
  SELECT 'stomp-main.jpg', 'stomp-thumb.jpg', 'Stomp'
  UNION ALL
  SELECT 'cinderella-main.jpg', 'cinderella-thumb.jpg', 'Cinderella''s Magical Ball'
  UNION ALL
  SELECT 'lion-king-main.jpg', 'lion-king-thumb.jpg', 'The Lion King Jr.'
  UNION ALL
  SELECT 'frozen-main.jpg', 'frozen-thumb.jpg', 'Frozen: A Musical Journey'
  UNION ALL
  SELECT 'peter-pan-main.jpg', 'peter-pan-thumb.jpg', 'Peter Pan: Never Grow Up'
  UNION ALL
  SELECT 'pinocchio-main.jpg', 'pinocchio-thumb.jpg', 'The Tale of Pinocchio'
  UNION ALL
  SELECT 'scenes-memory-main.jpg', 'scenes-memory-thumb.jpg', 'Scenes from a Memory'
  UNION ALL
  SELECT 'absurd-chronicles-main.jpg', 'absurd-chronicles-thumb.jpg', 'The Absurd Chronicles'
  UNION ALL
  SELECT 'metamorphosis-main.jpg', 'metamorphosis-thumb.jpg', 'Metamorphosis: A Body Work'
  UNION ALL
  SELECT 'hour-glass-main.jpg', 'hour-glass-thumb.jpg', 'The Hour Glass'
  UNION ALL
  SELECT 'merchant-venice-main.jpg', 'merchant-venice-thumb.jpg', 'The Merchant of Venice'
  UNION ALL
  SELECT 'tempest-main.jpg', 'tempest-thumb.jpg', 'The Tempest'
  UNION ALL
  SELECT 'midsummer-night-main.jpg', 'midsummer-night-thumb.jpg', 'A Midsummer Night''s Dream'
  UNION ALL
  SELECT 'taming-shrew-main.jpg', 'taming-shrew-thumb.jpg', 'The Taming of the Shrew'
  UNION ALL
  SELECT 'tartuffe-main.jpg', 'tartuffe-thumb.jpg', 'Tartuffe'
  UNION ALL
  SELECT 'streetcar-desire-main.jpg', 'streetcar-desire-thumb.jpg', 'A Streetcar Named Desire'
  UNION ALL
  SELECT 'death-salesman-main.jpg', 'death-salesman-thumb.jpg', 'Death of a Salesman'
  UNION ALL
  SELECT 'the-visit-main.jpg', 'the-visit-thumb.jpg', 'The Visit'
  UNION ALL
  SELECT 'blood-wedding-main.jpg', 'blood-wedding-thumb.jpg', 'Blood Wedding'
  UNION ALL
  SELECT 'waiting-godot-main.jpg', 'waiting-godot-thumb.jpg', 'Waiting for Godot'
  UNION ALL
  SELECT 'birthday-party-main.jpg', 'birthday-party-thumb.jpg', 'The Birthday Party'
  UNION ALL
  SELECT 'rosencrantz-guildenstern-main.jpg', 'rosencrantz-guildenstern-thumb.jpg', 'Rosencrantz and Guildenstern Are Dead'
  UNION ALL
  SELECT 'inspector-calls-main.jpg', 'inspector-calls-thumb.jpg', 'An Inspector Calls'
  UNION ALL
  SELECT 'crucible-new-vision-main.jpg', 'crucible-new-vision-thumb.jpg', 'The Crucible: A New Vision'
  UNION ALL
  SELECT 'cabaret-main.jpg', 'cabaret-thumb.jpg', 'Cabaret'
  UNION ALL
  SELECT 'chicago-main.jpg', 'chicago-thumb.jpg', 'Chicago'
  UNION ALL
  SELECT 'rent-main.jpg', 'rent-thumb.jpg', 'Rent'
  UNION ALL
  SELECT 'hamilton-main.jpg', 'hamilton-thumb.jpg', 'Hamilton'
  UNION ALL
  SELECT 'dear-evan-hansen-main.jpg', 'dear-evan-hansen-thumb.jpg', 'Dear Evan Hansen'
)
INSERT INTO shows (id, title, subtitle, slug, description, image_id, thumbnail_image_id, base_price, status, publication_date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  show_images.show_title as title,
  CASE
    WHEN show_images.show_title = 'Hamlet: A Tragedy Revisited' THEN 'Modern interpretation of Shakespeare''s masterpiece'
    WHEN show_images.show_title = 'The Glass Menagerie' THEN 'A memory play about family and dreams'
    WHEN show_images.show_title = 'Ghosts' THEN 'Norwegian tragedy of secrets and sin'
    WHEN show_images.show_title = 'A Doll''s House' THEN 'The story of Nora''s liberation'
    WHEN show_images.show_title = 'The Crucible' THEN 'Witch hunts in 1600s Salem'
    WHEN show_images.show_title = 'The Importance of Being Earnest' THEN 'A comedy of errors and mistaken identities'
    WHEN show_images.show_title = 'Much Ado About Nothing' THEN 'Shakespeare''s romantic comedy'
    WHEN show_images.show_title = 'Twelfth Night' THEN 'Love, mistaken identities, and magic'
    WHEN show_images.show_title = 'Noises Off' THEN 'Chaos backstage at a theater'
    WHEN show_images.show_title = 'One-Liners and Laughter' THEN 'Stand-up comedy showcase'
    WHEN show_images.show_title = 'Les Misérables' THEN 'The epic tale of love and revolution'
    WHEN show_images.show_title = 'The Phantom of the Opera' THEN 'Love in the shadows of an opera house'
    WHEN show_images.show_title = 'Evita' THEN 'The story of Argentina''s first lady'
    WHEN show_images.show_title = 'West Side Story' THEN 'Modern Romeo and Juliet on New York streets'
    WHEN show_images.show_title = 'Sweeney Todd' THEN 'The demon barber of Fleet Street'
    WHEN show_images.show_title = 'Swan Lake' THEN 'The timeless ballet of tragedy and magic'
    WHEN show_images.show_title = 'The Nutcracker' THEN 'A holiday classic for all ages'
    WHEN show_images.show_title = 'Giselle' THEN 'Love beyond the grave'
    WHEN show_images.show_title = 'Contemporary Dance Fusion' THEN 'Modern movements and ancient rhythms'
    WHEN show_images.show_title = 'Stomp' THEN 'Percussion and movement art'
    WHEN show_images.show_title = 'Cinderella''s Magical Ball' THEN 'A fairy tale adventure'
    WHEN show_images.show_title = 'The Lion King Jr.' THEN 'The Pride Lands come to life'
    WHEN show_images.show_title = 'Frozen: A Musical Journey' THEN 'Let it go - into adventure'
    WHEN show_images.show_title = 'Peter Pan: Never Grow Up' THEN 'Tales from Neverland'
    WHEN show_images.show_title = 'The Tale of Pinocchio' THEN 'When wishes come true'
    WHEN show_images.show_title = 'Scenes from a Memory' THEN 'A philosophical exploration'
    WHEN show_images.show_title = 'The Absurd Chronicles' THEN 'Theater of the illogical'
    WHEN show_images.show_title = 'Metamorphosis: A Body Work' THEN 'Physical theater at its finest'
    WHEN show_images.show_title = 'The Hour Glass' THEN 'Time slips through our fingers'
    WHEN show_images.show_title = 'The Merchant of Venice' THEN 'Portia''s wisdom and Shylock''s pound of flesh'
    WHEN show_images.show_title = 'The Tempest' THEN 'Magic, forgiveness, and restoration'
    WHEN show_images.show_title = 'A Midsummer Night''s Dream' THEN 'Love and magic in the forest'
    WHEN show_images.show_title = 'The Taming of the Shrew' THEN 'Love through conflict and wit'
    WHEN show_images.show_title = 'Tartuffe' THEN 'Molière''s comedy of deceit'
    WHEN show_images.show_title = 'A Streetcar Named Desire' THEN 'Passion and desperation in New Orleans'
    WHEN show_images.show_title = 'Death of a Salesman' THEN 'The tragedy of American dreams'
    WHEN show_images.show_title = 'The Visit' THEN 'A town''s conscience tested'
    WHEN show_images.show_title = 'Blood Wedding' THEN 'García Lorca''s tragedy of love and fate'
    WHEN show_images.show_title = 'Waiting for Godot' THEN 'Absurdism in a masterpiece'
    WHEN show_images.show_title = 'The Birthday Party' THEN 'A sinister gathering'
    WHEN show_images.show_title = 'Rosencrantz and Guildenstern Are Dead' THEN 'Hamlet reimagined'
    WHEN show_images.show_title = 'An Inspector Calls' THEN 'A mystery unfolds over dinner'
    WHEN show_images.show_title = 'The Crucible: A New Vision' THEN 'Witch hunts reimagined'
    WHEN show_images.show_title = 'Cabaret' THEN 'Decadence and darkness in Berlin'
    WHEN show_images.show_title = 'Chicago' THEN 'Razzle dazzle and murder'
    WHEN show_images.show_title = 'Rent' THEN 'Love and bohemia in NYC'
    WHEN show_images.show_title = 'Hamilton' THEN 'An American musical revolution'
    WHEN show_images.show_title = 'Dear Evan Hansen' THEN 'A letter that changes everything'
  END as subtitle,
  CASE
    WHEN show_images.show_title = 'Hamlet: A Tragedy Revisited' THEN 'hamlet-revisited'
    WHEN show_images.show_title = 'The Glass Menagerie' THEN 'glass-menagerie'
    WHEN show_images.show_title = 'Ghosts' THEN 'ghosts-ibsen'
    WHEN show_images.show_title = 'A Doll''s House' THEN 'dolls-house'
    WHEN show_images.show_title = 'The Crucible' THEN 'crucible-salem'
    WHEN show_images.show_title = 'The Importance of Being Earnest' THEN 'importance-earnest'
    WHEN show_images.show_title = 'Much Ado About Nothing' THEN 'much-ado-nothing'
    WHEN show_images.show_title = 'Twelfth Night' THEN 'twelfth-night'
    WHEN show_images.show_title = 'Noises Off' THEN 'noises-off'
    WHEN show_images.show_title = 'One-Liners and Laughter' THEN 'one-liners-showcase'
    WHEN show_images.show_title = 'Les Misérables' THEN 'les-miserables'
    WHEN show_images.show_title = 'The Phantom of the Opera' THEN 'phantom-opera'
    WHEN show_images.show_title = 'Evita' THEN 'evita-musical'
    WHEN show_images.show_title = 'West Side Story' THEN 'west-side-story'
    WHEN show_images.show_title = 'Sweeney Todd' THEN 'sweeney-todd'
    WHEN show_images.show_title = 'Swan Lake' THEN 'swan-lake'
    WHEN show_images.show_title = 'The Nutcracker' THEN 'nutcracker'
    WHEN show_images.show_title = 'Giselle' THEN 'giselle'
    WHEN show_images.show_title = 'Contemporary Dance Fusion' THEN 'contemporary-fusion'
    WHEN show_images.show_title = 'Stomp' THEN 'stomp'
    WHEN show_images.show_title = 'Cinderella''s Magical Ball' THEN 'cinderella-magical'
    WHEN show_images.show_title = 'The Lion King Jr.' THEN 'lion-king-jr'
    WHEN show_images.show_title = 'Frozen: A Musical Journey' THEN 'frozen-musical'
    WHEN show_images.show_title = 'Peter Pan: Never Grow Up' THEN 'peter-pan-neverland'
    WHEN show_images.show_title = 'The Tale of Pinocchio' THEN 'pinocchio-tale'
    WHEN show_images.show_title = 'Scenes from a Memory' THEN 'scenes-memory'
    WHEN show_images.show_title = 'The Absurd Chronicles' THEN 'absurd-chronicles'
    WHEN show_images.show_title = 'Metamorphosis: A Body Work' THEN 'metamorphosis-body'
    WHEN show_images.show_title = 'The Hour Glass' THEN 'hour-glass'
    WHEN show_images.show_title = 'The Merchant of Venice' THEN 'merchant-venice'
    WHEN show_images.show_title = 'The Tempest' THEN 'tempest'
    WHEN show_images.show_title = 'A Midsummer Night''s Dream' THEN 'midsummer-night'
    WHEN show_images.show_title = 'The Taming of the Shrew' THEN 'taming-shrew'
    WHEN show_images.show_title = 'Tartuffe' THEN 'tartuffe'
    WHEN show_images.show_title = 'A Streetcar Named Desire' THEN 'streetcar-desire'
    WHEN show_images.show_title = 'Death of a Salesman' THEN 'death-salesman'
    WHEN show_images.show_title = 'The Visit' THEN 'the-visit'
    WHEN show_images.show_title = 'Blood Wedding' THEN 'blood-wedding'
    WHEN show_images.show_title = 'Waiting for Godot' THEN 'waiting-godot'
    WHEN show_images.show_title = 'The Birthday Party' THEN 'birthday-party'
    WHEN show_images.show_title = 'Rosencrantz and Guildenstern Are Dead' THEN 'rosencrantz-guildenstern'
    WHEN show_images.show_title = 'An Inspector Calls' THEN 'inspector-calls'
    WHEN show_images.show_title = 'The Crucible: A New Vision' THEN 'crucible-new-vision'
    WHEN show_images.show_title = 'Cabaret' THEN 'cabaret'
    WHEN show_images.show_title = 'Chicago' THEN 'chicago'
    WHEN show_images.show_title = 'Rent' THEN 'rent'
    WHEN show_images.show_title = 'Hamilton' THEN 'hamilton'
    WHEN show_images.show_title = 'Dear Evan Hansen' THEN 'dear-evan-hansen'
  END as slug,
  CASE
    WHEN show_images.show_title = 'Hamlet: A Tragedy Revisited' THEN 'A bold reinterpretation of Shakespeare''s greatest tragedy, bringing medieval Denmark into contemporary times. Explore themes of madness, revenge, and mortality through avant-garde staging.'
    WHEN show_images.show_title = 'The Glass Menagerie' THEN 'Tennessee Williams'' poignant masterpiece about the Wingfield family, their fragile dreams, and the weight of unfulfilled aspirations in post-war America.'
    WHEN show_images.show_title = 'Ghosts' THEN 'Henrik Ibsen''s haunting exploration of family secrets, inherited sins, and the ghosts of the past that haunt us all.'
    WHEN show_images.show_title = 'A Doll''s House' THEN 'A revolutionary play about personal freedom, marriage, and self-discovery. Nora''s journey will challenge everything you know about family and identity.'
    WHEN show_images.show_title = 'The Crucible' THEN 'Arthur Miller''s gripping examination of the Salem witch trials as a metaphor for McCarthyism and mass hysteria.'
    WHEN show_images.show_title = 'The Importance of Being Earnest' THEN 'Oscar Wilde''s brilliant comedy of manners filled with wit, wordplay, and absurd situations that will keep you laughing throughout.'
    WHEN show_images.show_title = 'Much Ado About Nothing' THEN 'A delightful Shakespeare comedy about love, wit, and the games we play to win each other''s hearts.'
    WHEN show_images.show_title = 'Twelfth Night' THEN 'Shakespeare''s magical comedy about love in all its forms, featuring a shipwrecked heroine, a lovesick duke, and countless laughs.'
    WHEN show_images.show_title = 'Noises Off' THEN 'A hilarious farce that takes you behind the curtain to witness the absolute mayhem of a failing production.'
    WHEN show_images.show_title = 'One-Liners and Laughter' THEN 'An evening of sharp wit, clever observations, and laugh-out-loud moments from some of the best comedians around.'
    WHEN show_images.show_title = 'Les Misérables' THEN 'The world''s most beloved musical brings the streets of Paris to life with unforgettable songs and a story that will move you to tears.'
    WHEN show_images.show_title = 'The Phantom of the Opera' THEN 'Andrew Lloyd Webber''s masterpiece about obsession, beauty, and the power of music. A theatrical experience like no other.'
    WHEN show_images.show_title = 'Evita' THEN 'A dynamic musical about ambition, power, and the rise of Eva Perón. Featuring the iconic "Don''t Cry For Me Argentina."'
    WHEN show_images.show_title = 'West Side Story' THEN 'The groundbreaking musical retelling Shakespeare''s greatest love story in 1950s New York with stunning choreography and music.'
    WHEN show_images.show_title = 'Sweeney Todd' THEN 'Stephen Sondheim''s dark musical masterpiece about a revenge-driven barber and the secrets hidden in Victorian London.'
    WHEN show_images.show_title = 'Swan Lake' THEN 'Tchaikovsky''s magnificent ballet about love, deception, and transformation. A visual and musical feast.'
    WHEN show_images.show_title = 'The Nutcracker' THEN 'Journey into a magical world of dancing sugar plums, toy soldiers, and holiday wonder. The perfect festive experience.'
    WHEN show_images.show_title = 'Giselle' THEN 'The romantic ballet about a peasant girl who rises from the dead to protect her lover from vengeance.'
    WHEN show_images.show_title = 'Contemporary Dance Fusion' THEN 'An innovative exploration of contemporary dance mixed with influences from cultures around the world.'
    WHEN show_images.show_title = 'Stomp' THEN 'A unique theatrical experience where everything from trash cans to brooms becomes an instrument.'
    WHEN show_images.show_title = 'Cinderella''s Magical Ball' THEN 'An interactive retelling of Cinderella with sing-alongs, dancing, and magic. Perfect for children and families.'
    WHEN show_images.show_title = 'The Lion King Jr.' THEN 'A stunning adaptation of the beloved Disney musical performed by an ensemble of talented young actors.'
    WHEN show_images.show_title = 'Frozen: A Musical Journey' THEN 'Follow Elsa and Anna''s journey as they navigate love, power, and sisterhood in this theatrical adaptation.'
    WHEN show_images.show_title = 'Peter Pan: Never Grow Up' THEN 'Soar through the night sky to Neverland with Peter Pan, mermaids, pirates, and Lost Boys in an enchanting adventure.'
    WHEN show_images.show_title = 'The Tale of Pinocchio' THEN 'A charming retelling of the puppet who dreams of becoming a real boy, with lessons about honesty and courage.'
    WHEN show_images.show_title = 'Scenes from a Memory' THEN 'An abstract, poetic piece that questions the nature of memory, identity, and reality. Not for the easily confused!'
    WHEN show_images.show_title = 'The Absurd Chronicles' THEN 'A surreal journey through illogical scenarios and impossible situations. Expect the unexpected.'
    WHEN show_images.show_title = 'Metamorphosis: A Body Work' THEN 'A stunning contemporary piece using the body as a canvas to explore transformation, struggle, and rebirth.'
    WHEN show_images.show_title = 'The Hour Glass' THEN 'An experimental meditation on time, aging, and the fleeting nature of existence. Visually mesmerizing.'
    WHEN show_images.show_title = 'The Merchant of Venice' THEN 'Shakespeare''s complex play about love, money, justice, and prejudice in renaissance Venice.'
    WHEN show_images.show_title = 'The Tempest' THEN 'Shakespeare''s final masterpiece about shipwrecks, sorcery, and the power of forgiveness.'
    WHEN show_images.show_title = 'A Midsummer Night''s Dream' THEN 'Shakespeare''s enchanting comedy about young lovers, magical fairies, and hilarious confusion.'
    WHEN show_images.show_title = 'The Taming of the Shrew' THEN 'Shakespeare''s battle-of-the-sexes comedy about stubborn Katherine and the man who tames her.'
    WHEN show_images.show_title = 'Tartuffe' THEN 'A Parisian household is thrown into chaos when a cunning con-man manipulates a wealthy family.'
    WHEN show_images.show_title = 'A Streetcar Named Desire' THEN 'Tennessee Williams'' searing drama about social status, mental illness, and raw human passion colliding.'
    WHEN show_images.show_title = 'Death of a Salesman' THEN 'Arthur Miller''s masterpiece about Willy Loman''s downfall and the cost of chasing the American dream.'
    WHEN show_images.show_title = 'The Visit' THEN 'A wealthy woman returns to her hometown to exact revenge, testing the morality of its residents.'
    WHEN show_images.show_title = 'Blood Wedding' THEN 'A dark Spanish drama about a wedding interrupted by a forbidden love affair and its fatal consequences.'
    WHEN show_images.show_title = 'Waiting for Godot' THEN 'Beckett''s enigmatic play about two men waiting for someone who never arrives. Philosophical and peculiar.'
    WHEN show_images.show_title = 'The Birthday Party' THEN 'Pinter''s unsettling comedy-drama about the mysterious arrival of two men to a seaside boarding house.'
    WHEN show_images.show_title = 'Rosencrantz and Guildenstern Are Dead' THEN 'Tom Stoppard''s brilliant metatheatrical comedy following minor Hamlet characters in their own story.'
    WHEN show_images.show_title = 'An Inspector Calls' THEN 'J.B. Priestley''s thriller about a mysterious inspector''s visit to a wealthy family revealing dark secrets.'
    WHEN show_images.show_title = 'The Crucible: A New Vision' THEN 'A fresh, contemporary staging of Arthur Miller''s powerful play about hysteria and persecution.'
    WHEN show_images.show_title = 'Cabaret' THEN 'The musical set in 1930s Berlin explores morality, sexuality, and the rise of Nazi Germany.'
    WHEN show_images.show_title = 'Chicago' THEN 'The cynical musical about crime, showbiz, and corruption in Jazz Age Chicago.'
    WHEN show_images.show_title = 'Rent' THEN 'Jonathan Larson''s rock musical about struggling artists, love, loss, and the importance of community.'
    WHEN show_images.show_title = 'Hamilton' THEN 'Lin-Manuel Miranda''s hip-hop musical about founding father Alexander Hamilton. A modern masterpiece.'
    WHEN show_images.show_title = 'Dear Evan Hansen' THEN 'A contemporary musical about connection, grief, and the impact we have on others'' lives.'
  END as description,
  (SELECT id FROM image_map WHERE filename = show_images.main_filename) as image_id,
  (SELECT id FROM image_map WHERE filename = show_images.thumb_filename) as thumbnail_image_id,
  CASE 
    WHEN show_images.show_title LIKE '%Les Misérables%' THEN 35.00
    WHEN show_images.show_title LIKE '%Phantom%' THEN 38.00
    WHEN show_images.show_title LIKE '%Hamilton%' THEN 45.00
    WHEN show_images.show_title LIKE '%West Side%' THEN 34.00
    WHEN show_images.show_title LIKE '%Evita%' THEN 32.00
    WHEN show_images.show_title LIKE '%Sweeney%' THEN 30.00
    WHEN show_images.show_title LIKE '%Swan Lake%' THEN 40.00
    WHEN show_images.show_title LIKE '%Nutcracker%' THEN 35.00
    WHEN show_images.show_title LIKE '%Giselle%' THEN 38.00
    WHEN show_images.show_title LIKE '%Cabaret%' THEN 33.00
    WHEN show_images.show_title LIKE '%Chicago%' THEN 32.00
    WHEN show_images.show_title LIKE '%Rent%' THEN 31.00
    WHEN show_images.show_title LIKE '%Dear%' THEN 34.00
    WHEN show_images.show_title LIKE '%Lion King%' THEN 20.00
    WHEN show_images.show_title LIKE '%Frozen%' THEN 22.00
    WHEN show_images.show_title LIKE '%One-Liners%' THEN 18.00
    WHEN show_images.show_title LIKE '%Absurd%' THEN 18.00
    WHEN show_images.show_title LIKE '%Scenes%' THEN 20.00
    WHEN show_images.show_title LIKE '%Hour%' THEN 22.00
    WHEN show_images.show_title LIKE '%Contemporary%' THEN 26.00
    WHEN show_images.show_title LIKE '%Stomp%' THEN 28.00
    WHEN show_images.show_title LIKE '%Cinderella%' THEN 15.00
    WHEN show_images.show_title LIKE '%Peter Pan%' THEN 18.00
    WHEN show_images.show_title LIKE '%Pinocchio%' THEN 16.00
    WHEN show_images.show_title LIKE '%Crucible%' AND show_images.show_title NOT LIKE '%New Vision%' THEN 21.00
    WHEN show_images.show_title LIKE '%New Vision%' THEN 21.00
    WHEN show_images.show_title LIKE '%Metamorphosis%' THEN 25.00
    ELSE 23.00
  END as base_price,
  'published' as status,
  NOW() as publication_date,
  NOW() as created_at,
  NOW() as updated_at
FROM show_images;

-- Get tag IDs for mapping (we''ll use a simpler approach with explicit tag assignments)
-- ============================================
-- Insert Performances (Multiple per show, spread over next 3 months)
-- ============================================

-- Helper: Get show ID for a given title and insert performances
-- For each show, we''ll insert 3-5 performances spread over the next 3 months

DO $$
DECLARE
  v_show RECORD;
  v_show_id UUID;
  v_perf_count INT;
  v_perf_idx INT;
BEGIN
  -- Insert performances for each show
  FOR v_show IN
    SELECT id FROM shows ORDER BY title
  LOOP
    v_show_id := v_show.id;
    v_perf_count := FLOOR(RANDOM() * 3)::INT + 3; -- 3-5 performances per show
    
    FOR v_perf_idx IN 1..v_perf_count LOOP
      INSERT INTO performances (id, show_id, date, price, total_seats, available_seats, status, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_show_id,
        NOW() + ((RANDOM() * 90)::INT || ' days')::INTERVAL + ((RANDOM() * 24)::INT || ' hours')::INTERVAL,
        (SELECT base_price FROM shows WHERE id = v_show_id),
        100,
        FLOOR(RANDOM() * 50 + 30)::INT, -- 30-80 available seats for variety
        'published',
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Assign Tags to Shows (Many-to-Many)
-- ============================================

-- Helper function to link shows to tags
WITH tag_map AS (
  SELECT id, slug FROM tags
),
show_tag_assignments AS (
  -- Drama shows get 'drama' and optionally others
  SELECT s.id as show_id, t.id as tag_id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Hamlet%' OR s.title LIKE '%Glass%' OR s.title LIKE '%Ghosts%' OR s.title LIKE '%Doll%' OR s.title LIKE '%Crucible%' OR s.title LIKE '%Merchant%' OR s.title LIKE '%Tempest%' OR s.title LIKE '%Midsummer%' OR s.title LIKE '%Shrew%' OR s.title LIKE '%Tartuffe%' OR s.title LIKE '%Streetcar%' OR s.title LIKE '%Death%' OR s.title LIKE '%Visit%' OR s.title LIKE '%Blood%' OR s.title LIKE '%Waiting%' OR s.title LIKE '%Birthday%' OR s.title LIKE '%Rosencrantz%' OR s.title LIKE '%Inspector%') AND t.slug = 'drama'
  UNION ALL
  -- Shakespeare shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Hamlet%' OR s.title LIKE '%Much Ado%' OR s.title LIKE '%Twelfth%' OR s.title LIKE '%Merchant%' OR s.title LIKE '%Tempest%' OR s.title LIKE '%Midsummer%' OR s.title LIKE '%Shrew%') AND t.slug = 'shakespeare'
  UNION ALL
  -- Comedy shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Importance%' OR s.title LIKE '%Much Ado%' OR s.title LIKE '%Twelfth%' OR s.title LIKE '%Noises%' OR s.title LIKE '%One-Liners%' OR s.title LIKE '%Tartuffe%') AND t.slug = 'comedy'
  UNION ALL
  -- Musical shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Misérables%' OR s.title LIKE '%Phantom%' OR s.title LIKE '%Evita%' OR s.title LIKE '%West Side%' OR s.title LIKE '%Sweeney%' OR s.title LIKE '%Cabaret%' OR s.title LIKE '%Chicago%' OR s.title LIKE '%Rent%' OR s.title LIKE '%Hamilton%' OR s.title LIKE '%Dear%') AND t.slug = 'musical'
  UNION ALL
  -- Dance shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Swan%' OR s.title LIKE '%Nutcracker%' OR s.title LIKE '%Giselle%' OR s.title LIKE '%Contemporary Dance%' OR s.title LIKE '%Stomp%') AND t.slug = 'dance'
  UNION ALL
  -- Kids shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Cinderella%' OR s.title LIKE '%Lion King%' OR s.title LIKE '%Frozen%' OR s.title LIKE '%Peter Pan%' OR s.title LIKE '%Pinocchio%') AND t.slug = 'kids'
  UNION ALL
  -- Contemporary shows
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Scenes%' OR s.title LIKE '%Absurd%' OR s.title LIKE '%Metamorphosis%' OR s.title LIKE '%Hour%') AND t.slug = 'contemporary'
  UNION ALL
  -- World theater
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Blood Wedding%') AND t.slug = 'world-theater'
  UNION ALL
  -- Improv/Contemporary hybrid
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Absurd%') AND t.slug = 'improv'
)
INSERT INTO show_tags (show_id, tag_id, created_at)
SELECT show_id, tag_id, NOW() FROM show_tag_assignments
ON CONFLICT DO NOTHING;

-- ============================================
-- Summary
-- ============================================
-- Total shows: 40+
-- Total tags: 10
-- Performances: 3-5 per show (120-200 total)
-- All shows are published and have performances in the next 90 days
