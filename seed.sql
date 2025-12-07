
-- ============================================
-- Seed-script voor theaterdatabase
-- Voegt 40+ voorstellingen toe met voorstellingen en tags
-- ============================================

-- Wis bestaande gegevens (in omgekeerde volgorde van foreign key-afhankelijkheden)
TRUNCATE TABLE show_tags RESTART IDENTITY CASCADE;
TRUNCATE TABLE performances RESTART IDENTITY CASCADE;
TRUNCATE TABLE shows RESTART IDENTITY CASCADE;
TRUNCATE TABLE tags RESTART IDENTITY CASCADE;
-- Opmerking: afbeeldingen worden ingevoegd door `seed-database.mjs` (niet verwijderd om afbeeldingsdata te behouden)

-- ============================================
-- Voeg tags toe
-- ============================================
INSERT INTO tags (id, name, slug, description, created_at) VALUES
  (gen_random_uuid(), 'Drama', 'drama', 'Dramatische theatervoorstellingen', NOW()),
  (gen_random_uuid(), 'Komedie', 'comedy', 'Komedische en humoristische voorstellingen', NOW()),
  (gen_random_uuid(), 'Musical', 'musical', 'Musicaltheater en zangvoorstellingen', NOW()),
  (gen_random_uuid(), 'Dans', 'dance', 'Dansvoorstellingen en choreografie', NOW()),
  (gen_random_uuid(), 'Kinderen', 'kids', 'Gezinsvriendelijke voorstellingen voor kinderen', NOW()),
  (gen_random_uuid(), 'Hedendaags', 'contemporary', 'Hedendaags en experimenteel theater', NOW()),
  (gen_random_uuid(), 'Shakespeare', 'shakespeare', 'Klassieke Shakespeare-producties', NOW()),
  (gen_random_uuid(), 'Improvisatie', 'improv', 'Improvisatietheater', NOW()),
  (gen_random_uuid(), 'Stand-up', 'stand-up', 'Stand-upcomedy en monologen', NOW()),
  (gen_random_uuid(), 'Wereldtheater', 'world-theater', 'Theater uit alle windstreken', NOW());

-- ============================================
-- Voeg voorstellingen toe (40+ items)
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
    WHEN show_images.show_title = 'Hamlet: A Tragedy Revisited' THEN 'Moderne interpretatie van Shakespeares meesterwerk'
    WHEN show_images.show_title = 'The Glass Menagerie' THEN 'Een herinneringsspel over familie en dromen'
    WHEN show_images.show_title = 'Ghosts' THEN 'Noorse tragedie over geheimen en zonden'
    WHEN show_images.show_title = 'A Doll''s House' THEN 'Het verhaal van Nora''s bevrijding'
    WHEN show_images.show_title = 'The Crucible' THEN 'Heksenjachten in het Salem van de 17e eeuw'
    WHEN show_images.show_title = 'The Importance of Being Earnest' THEN 'Een komedie van verwisselde identiteiten en misverstanden'
    WHEN show_images.show_title = 'Much Ado About Nothing' THEN 'Shakespeares romantische komedie'
    WHEN show_images.show_title = 'Twelfth Night' THEN 'Liefde, verwisselde identiteiten en magie'
    WHEN show_images.show_title = 'Noises Off' THEN 'Chaos achter de schermen van een voorstelling'
    WHEN show_images.show_title = 'One-Liners and Laughter' THEN 'Een avond vol stand-up en scherpe grappen'
    WHEN show_images.show_title = 'Les Misérables' THEN 'Het epische verhaal van liefde en revolutie'
    WHEN show_images.show_title = 'The Phantom of the Opera' THEN 'Liefde in de schaduw van een operagebouw'
    WHEN show_images.show_title = 'Evita' THEN 'Het levensverhaal van Argentiniës eerste dame'
    WHEN show_images.show_title = 'West Side Story' THEN 'Een moderne Romeo en Julia op de straten van New York'
    WHEN show_images.show_title = 'Sweeney Todd' THEN 'De demonische kapper van Fleet Street'
    WHEN show_images.show_title = 'Swan Lake' THEN 'Het tijdloze ballet van tragedie en magie'
    WHEN show_images.show_title = 'The Nutcracker' THEN 'Een feestelijke klassieker voor alle leeftijden'
    WHEN show_images.show_title = 'Giselle' THEN 'Liefde voorbij het graf'
    WHEN show_images.show_title = 'Contemporary Dance Fusion' THEN 'Moderne bewegingen met invloeden van over de hele wereld'
    WHEN show_images.show_title = 'Stomp' THEN 'Percussie en beweging als kunstvorm'
    WHEN show_images.show_title = 'Cinderella''s Magical Ball' THEN 'Een sprookjesachtige familievoorstelling'
    WHEN show_images.show_title = 'The Lion King Jr.' THEN 'De Pride Lands komen tot leven'
    WHEN show_images.show_title = 'Frozen: A Musical Journey' THEN 'Een muzikaal avontuur met Elsa en Anna'
    WHEN show_images.show_title = 'Peter Pan: Never Grow Up' THEN 'Verhalen uit Nooitgedachtland'
    WHEN show_images.show_title = 'The Tale of Pinocchio' THEN 'Het verhaal van een houten pop die mens wil worden'
    WHEN show_images.show_title = 'Scenes from a Memory' THEN 'Een filosofische verkenning van geheugen en identiteit'
    WHEN show_images.show_title = 'The Absurd Chronicles' THEN 'Een surrealistische reis vol onlogische situaties'
    WHEN show_images.show_title = 'Metamorphosis: A Body Work' THEN 'Fysiek theater op zijn best'
    WHEN show_images.show_title = 'The Hour Glass' THEN 'Een experimentele meditatie over tijd en vergankelijkheid'
    WHEN show_images.show_title = 'The Merchant of Venice' THEN 'Shakespeares verhaal over liefde, geld en gerechtigheid'
    WHEN show_images.show_title = 'The Tempest' THEN 'Shakespeares meesterwerk over magie en vergeving'
    WHEN show_images.show_title = 'A Midsummer Night''s Dream' THEN 'Liefde en magie in het bos'
    WHEN show_images.show_title = 'The Taming of the Shrew' THEN 'Liefde door conflict en verstandigheid'
    WHEN show_images.show_title = 'Tartuffe' THEN 'Molières komedie over bedrog'
    WHEN show_images.show_title = 'A Streetcar Named Desire' THEN 'Passie en wanhoop in New Orleans'
    WHEN show_images.show_title = 'Death of a Salesman' THEN 'De tragedie van de Amerikaanse droom'
    WHEN show_images.show_title = 'The Visit' THEN 'Het geweten van een stad op de proef gesteld'
    WHEN show_images.show_title = 'Blood Wedding' THEN 'Een Spaanse tragedie over verboden liefde en lotsbestemming'
    WHEN show_images.show_title = 'Waiting for Godot' THEN 'Beckett''s enigmatische stuk over wachten en bestaan'
    WHEN show_images.show_title = 'The Birthday Party' THEN 'Een onheilspellend samenzijn'
    WHEN show_images.show_title = 'Rosencrantz and Guildenstern Are Dead' THEN 'Tom Stoppards metatheatrale komedie'
    WHEN show_images.show_title = 'An Inspector Calls' THEN 'Een thriller over onthullende geheimen tijdens een diner'
    WHEN show_images.show_title = 'The Crucible: A New Vision' THEN 'Een frisse, hedendaagse bewerking over massahysterie'
    WHEN show_images.show_title = 'Cabaret' THEN 'Het muziektheater over decadentie en donker Berlijn'
    WHEN show_images.show_title = 'Chicago' THEN 'Een cynische musical over misdaad en showbizz'
    WHEN show_images.show_title = 'Rent' THEN 'Een rockmusical over liefde, verlies en gemeenschap'
    WHEN show_images.show_title = 'Hamilton' THEN 'Lin-Manuel Mirandas hiphopmusical over Alexander Hamilton'
    WHEN show_images.show_title = 'Dear Evan Hansen' THEN 'Een hedendaagse musical over verbinding en rouw'
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
    WHEN show_images.show_title = 'Hamlet: A Tragedy Revisited' THEN 'Een gedurfde herinterpretatie van Shakespeares grootste tragedie, geplaatst in een moderne context. Onderzoekt waanzin, wraak en sterfelijkheid met avant-garde enscenering.'
    WHEN show_images.show_title = 'The Glass Menagerie' THEN 'Tennessee Williams'' aangrijpende meesterwerk over de familie Wingfield, hun kwetsbare dromen en onvervulde verlangens na de oorlog.'
    WHEN show_images.show_title = 'Ghosts' THEN 'Henrik Ibsens spookachtige verkenning van familiegeheimen, erfelijke zonden en het verleden dat ons achtervolgt.'
    WHEN show_images.show_title = 'A Doll''s House' THEN 'Een revolutionair stuk over persoonlijke vrijheid, huwelijk en zelfontdekking. Nora''s reis daagt alles uit wat u weet over familie en identiteit.'
    WHEN show_images.show_title = 'The Crucible' THEN 'Arthur Millers aangrijpende onderzoek naar de hekseprocessen van Salem als metafoor voor McCarthyisme en massahysterie.'
    WHEN show_images.show_title = 'The Importance of Being Earnest' THEN 'Oscar Wildes briljante comedie vol spitsvondigheid, woordspel en absurde situaties die steeds voor lachsalvo''s zorgen.'
    WHEN show_images.show_title = 'Much Ado About Nothing' THEN 'Een heerlijke Shakespeare-komedie over liefde, verstand en de spelletjes die mensen met elkaar spelen.'
    WHEN show_images.show_title = 'Twelfth Night' THEN 'Shakespeares magische komedie over liefde in al haar vormen, met schipbreuk, verwarring en spot.'
    WHEN show_images.show_title = 'Noises Off' THEN 'Een hilarische klucht die u achter de schermen meeneemt en de complete chaos van een mislukte productie toont.'
    WHEN show_images.show_title = 'One-Liners and Laughter' THEN 'Een avond vol scherpe grappen, slimme observaties en luide lachmomenten van enkele van de beste comedians.'
    WHEN show_images.show_title = 'Les Misérables' THEN 'De wereldberoemde musical brengt het Parijs van vroeger tot leven met onvergetelijke liederen en een hartverscheurend verhaal.'
    WHEN show_images.show_title = 'The Phantom of the Opera' THEN 'Een meesterwerk over obsessie, schoonheid en de kracht van muziek. Een theatrale ervaring als geen ander.'
    WHEN show_images.show_title = 'Evita' THEN 'Een dynamische musical over ambitie, macht en de opkomst van Eva Perón. Inclusief het iconische "Don''t Cry For Me Argentina."'
    WHEN show_images.show_title = 'West Side Story' THEN 'De baanbrekende musical die Shakespeares liefdesverhaal in 1950s New York plaatst met adembenemende choreografie en muziek.'
    WHEN show_images.show_title = 'Sweeney Todd' THEN 'Stephen Sondheims duistere muzikale meesterwerk over een barbier gedreven door wraak en de geheimen van Victoriaans Londen.'
    WHEN show_images.show_title = 'Swan Lake' THEN 'Tchaikovsky''s prachtige ballet over liefde, bedrog en transformatie. Een visueel en muzikaal festijn.'
    WHEN show_images.show_title = 'The Nutcracker' THEN 'Reis naar een magische wereld van dansende suikerpruimen, speelgoed soldaatjes en feestelijke verwondering. Perfect voor de feestdagen.'
    WHEN show_images.show_title = 'Giselle' THEN 'De romantische balletvoorstelling over een boerenmeisje dat uit de dood herrijst om haar geliefde te beschermen.'
    WHEN show_images.show_title = 'Contemporary Dance Fusion' THEN 'Een innovatieve verkenning van hedendaagse dans met invloeden uit verschillende culturen.'
    WHEN show_images.show_title = 'Stomp' THEN 'Een unieke theatervoorstelling waarin alledaagse objecten als instrumenten dienen.'
    WHEN show_images.show_title = 'Cinderella''s Magical Ball' THEN 'Een interactieve vertelling van Assepoester met meezingmomenten, dans en magie. Perfect voor kinderen en gezinnen.'
    WHEN show_images.show_title = 'The Lion King Jr.' THEN 'Een indrukwekkende bewerking van de geliefde Disney-musical, uitgevoerd door getalenteerde jongeren.'
    WHEN show_images.show_title = 'Frozen: A Musical Journey' THEN 'Volg Elsa en Anna in een theaterbewerking over liefde, macht en zusterband.'
    WHEN show_images.show_title = 'Peter Pan: Never Grow Up' THEN 'Vlieg naar Nooitgedachtland met Peter Pan, zeemeerminnen, piraten en de Lost Boys in een betoverend avontuur.'
    WHEN show_images.show_title = 'The Tale of Pinocchio' THEN 'Een charmante vertelling over een houten pop die ernaar verlangt een echte jongen te worden, met lessen over eerlijkheid en moed.'
    WHEN show_images.show_title = 'Scenes from a Memory' THEN 'Een abstract en poëtisch stuk dat de aard van geheugen, identiteit en realiteit bevraagt.'
    WHEN show_images.show_title = 'The Absurd Chronicles' THEN 'Een surrealistische reis door onlogische scenario''s en onmogelijke situaties. Verwacht het onverwachte.'
    WHEN show_images.show_title = 'Metamorphosis: A Body Work' THEN 'Een verbluffend hedendaags stuk dat het lichaam als canvas gebruikt om transformatie, strijd en wedergeboorte te verbeelden.'
    WHEN show_images.show_title = 'The Hour Glass' THEN 'Een experimentele meditatie over tijd, ouder worden en de vluchtigheid van het bestaan.'
    WHEN show_images.show_title = 'The Merchant of Venice' THEN 'Shakespeares complexe stuk over liefde, geld, gerechtigheid en vooroordelen in renaissance Venetië.'
    WHEN show_images.show_title = 'The Tempest' THEN 'Shakespeares laatste meesterwerk over schipbreuken, tovenarij en de kracht van vergeving.'
    WHEN show_images.show_title = 'A Midsummer Night''s Dream' THEN 'Shakespeares betoverende komedie over jonge geliefden, magische feeën en hilarische verwarring.'
    WHEN show_images.show_title = 'The Taming of the Shrew' THEN 'Shakespeares strijd-van-de-sexen komedie over koppige Katherine en de man die haar temt.'
    WHEN show_images.show_title = 'Tartuffe' THEN 'Een Parijse huishouding in volledige chaos wanneer een sluwe bedrieger een rijke familie manipuleert.'
    WHEN show_images.show_title = 'A Streetcar Named Desire' THEN 'Tennessee Williams'' aangrijpende drama over sociale status, mentale gezondheid en rauwe menselijke passie.'
    WHEN show_images.show_title = 'Death of a Salesman' THEN 'Arthur Millers meesterwerk over Willy Lomans ondergang en de prijs van het najagen van de Amerikaanse droom.'
    WHEN show_images.show_title = 'The Visit' THEN 'Een rijke vrouw keert terug naar haar geboortestad om wraak te nemen, en test daarmee de moraal van de inwoners.'
    WHEN show_images.show_title = 'Blood Wedding' THEN 'Een duister Spaans drama over een bruiloft verstoord door verboden liefde en fatale gevolgen.'
    WHEN show_images.show_title = 'Waiting for Godot' THEN 'Becketts raadselachtige voorstelling over twee mannen die wachten op iemand die nooit komt.'
    WHEN show_images.show_title = 'The Birthday Party' THEN 'Pinter''s onheilspellende komedie-drama over de mysterieuze komst van twee mannen in een pension aan zee.'
    WHEN show_images.show_title = 'Rosencrantz and Guildenstern Are Dead' THEN 'Tom Stoppards briljante metatheatrale komedie over twee bijfiguren uit Hamlet.'
    WHEN show_images.show_title = 'An Inspector Calls' THEN 'J.B. Priestley''s thriller over een mysterieuze inspecteur die verborgen geheimen onthult.'
    WHEN show_images.show_title = 'The Crucible: A New Vision' THEN 'Een frisse, hedendaagse enscenering van Millers krachtige stuk over hysterie en vervolging.'
    WHEN show_images.show_title = 'Cabaret' THEN 'Een musical gesitueerd in het Berlijn van de jaren 30, over moraal, seksualiteit en de opkomst van het nazisme.'
    WHEN show_images.show_title = 'Chicago' THEN 'De cynische musical over misdaad, showbizz en corruptie in het Jazz Age Chicago.'
    WHEN show_images.show_title = 'Rent' THEN 'Jonathan Larsons rockmusical over worstelende artiesten, liefde, verlies en de kracht van gemeenschap.'
    WHEN show_images.show_title = 'Hamilton' THEN 'Lin-Manuel Mirandas hiphopmusical over Alexander Hamilton en de Amerikaanse revolutie.'
    WHEN show_images.show_title = 'Dear Evan Hansen' THEN 'Een hedendaagse musical over verbinding, rouw en de impact die we op elkaars leven hebben.'
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

-- Haal tag-IDs op voor mapping (we gebruiken een eenvoudige aanpak met expliciete tag-toewijzingen)
-- ============================================
-- Voeg voorstellingsdata toe (Meerdere per voorstelling, verspreid over de komende 3 maanden)
-- ============================================

-- Hulpfunctie: haal show-ID op voor een gegeven titel en voeg voorstellingen toe
-- Voor elke voorstelling voegen we 3-5 voorstellingsdata toe, verspreid over de komende 3 maanden

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
        FLOOR(RANDOM() * 50 + 30)::INT, -- 30-80 beschikbare plaatsen voor variatie
        'published',
        NOW(),
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Wijs tags toe aan voorstellingen (Many-to-Many)
-- ============================================

-- Hulpfunctie om voorstellingen aan tags te koppelen
WITH tag_map AS (
  SELECT id, slug FROM tags
),
show_tag_assignments AS (
  -- Dramashows krijgen 'drama' en eventueel extra tags
  SELECT s.id as show_id, t.id as tag_id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Hamlet%' OR s.title LIKE '%Glass%' OR s.title LIKE '%Ghosts%' OR s.title LIKE '%Doll%' OR s.title LIKE '%Crucible%' OR s.title LIKE '%Merchant%' OR s.title LIKE '%Tempest%' OR s.title LIKE '%Midsummer%' OR s.title LIKE '%Shrew%' OR s.title LIKE '%Tartuffe%' OR s.title LIKE '%Streetcar%' OR s.title LIKE '%Death%' OR s.title LIKE '%Visit%' OR s.title LIKE '%Blood%' OR s.title LIKE '%Waiting%' OR s.title LIKE '%Birthday%' OR s.title LIKE '%Rosencrantz%' OR s.title LIKE '%Inspector%') AND t.slug = 'drama'
  UNION ALL
  -- Shakespeare-voorstellingen
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Hamlet%' OR s.title LIKE '%Much Ado%' OR s.title LIKE '%Twelfth%' OR s.title LIKE '%Merchant%' OR s.title LIKE '%Tempest%' OR s.title LIKE '%Midsummer%' OR s.title LIKE '%Shrew%') AND t.slug = 'shakespeare'
  UNION ALL
  -- Komedie-voorstellingen
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Importance%' OR s.title LIKE '%Much Ado%' OR s.title LIKE '%Twelfth%' OR s.title LIKE '%Noises%' OR s.title LIKE '%One-Liners%' OR s.title LIKE '%Tartuffe%') AND t.slug = 'comedy'
  UNION ALL
  -- Musical-voorstellingen
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Misérables%' OR s.title LIKE '%Phantom%' OR s.title LIKE '%Evita%' OR s.title LIKE '%West Side%' OR s.title LIKE '%Sweeney%' OR s.title LIKE '%Cabaret%' OR s.title LIKE '%Chicago%' OR s.title LIKE '%Rent%' OR s.title LIKE '%Hamilton%' OR s.title LIKE '%Dear%') AND t.slug = 'musical'
  UNION ALL
  -- Dansvoorstellingen
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Swan%' OR s.title LIKE '%Nutcracker%' OR s.title LIKE '%Giselle%' OR s.title LIKE '%Contemporary Dance%' OR s.title LIKE '%Stomp%') AND t.slug = 'dance'
  UNION ALL
  -- Kindervoorstellingen
  SELECT s.id, t.id FROM shows s, tag_map t
  WHERE (s.title LIKE '%Cinderella%' OR s.title LIKE '%Lion King%' OR s.title LIKE '%Frozen%' OR s.title LIKE '%Peter Pan%' OR s.title LIKE '%Pinocchio%') AND t.slug = 'kids'
  UNION ALL
  -- Hedendaagse voorstellingen
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
-- Samenvatting
-- Totaal aantal voorstellingen: 40+
-- Totaal aantal tags: 10
-- Aantal voorstellingen per show: 3-5 (in totaal 120-200)
-- Alle voorstellingen zijn gepubliceerd en hebben voorstellingsdata in de komende 90 dagen
