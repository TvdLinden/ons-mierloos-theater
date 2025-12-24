-- migrate-descriptions-to-blocks.sql
-- This script updates the blocks column for each show based on its title, using the original descriptions as a serialized paragraph block.

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000001","type":"text","content":"Moderne interpretatie van Shakespeares meesterwerk","order":0}]'
WHERE title = 'Hamlet: A Tragedy Revisited';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000002","type":"text","content":"Een herinneringsspel over familie en dromen","order":0}]'
WHERE title = 'The Glass Menagerie';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000003","type":"text","content":"Noorse tragedie over geheimen en zonden","order":0}]'
WHERE title = 'Ghosts';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000004","type":"text","content":"Het verhaal van Nora''s bevrijding","order":0}]'
WHERE title = 'A Doll''s House';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000005","type":"text","content":"Heksenjachten in het Salem van de 17e eeuw","order":0}]'
WHERE title = 'The Crucible';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000006","type":"text","content":"Een komedie van verwisselde identiteiten en misverstanden","order":0}]'
WHERE title = 'The Importance of Being Earnest';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000007","type":"text","content":"Shakespeares romantische komedie","order":0}]'
WHERE title = 'Much Ado About Nothing';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000008","type":"text","content":"Liefde, verwisselde identiteiten en magie","order":0}]'
WHERE title = 'Twelfth Night';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000009","type":"text","content":"Chaos achter de schermen van een voorstelling","order":0}]'
WHERE title = 'Noises Off';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000010","type":"text","content":"Een avond vol stand-up en scherpe grappen","order":0}]'
WHERE title = 'One-Liners and Laughter';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000011","type":"text","content":"Het epische verhaal van liefde en revolutie","order":0}]'
WHERE title = 'Les Misérables';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000012","type":"text","content":"Liefde in de schaduw van een operagebouw","order":0}]'
WHERE title = 'The Phantom of the Opera';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000013","type":"text","content":"Het levensverhaal van Argentiniës eerste dame","order":0}]'
WHERE title = 'Evita';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000014","type":"text","content":"Een moderne Romeo en Julia op de straten van New York","order":0}]'
WHERE title = 'West Side Story';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000015","type":"text","content":"De demonische kapper van Fleet Street","order":0}]'
WHERE title = 'Sweeney Todd';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000016","type":"text","content":"Het tijdloze ballet van tragedie en magie","order":0}]'
WHERE title = 'Swan Lake';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000017","type":"text","content":"Een feestelijke klassieker voor alle leeftijden","order":0}]'
WHERE title = 'The Nutcracker';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000018","type":"text","content":"Liefde voorbij het graf","order":0}]'
WHERE title = 'Giselle';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000019","type":"text","content":"Moderne bewegingen met invloeden van over de hele wereld","order":0}]'
WHERE title = 'Contemporary Dance Fusion';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000020","type":"text","content":"Percussie en beweging als kunstvorm","order":0}]'
WHERE title = 'Stomp';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000021","type":"text","content":"Een sprookjesachtige familievoorstelling","order":0}]'
WHERE title = 'Cinderella''s Magical Ball';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000022","type":"text","content":"De Pride Lands komen tot leven","order":0}]'
WHERE title = 'The Lion King Jr.';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000023","type":"text","content":"Een muzikaal avontuur met Elsa en Anna","order":0}]'
WHERE title = 'Frozen: A Musical Journey';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000024","type":"text","content":"Verhalen uit Nooitgedachtland","order":0}]'
WHERE title = 'Peter Pan: Never Grow Up';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000025","type":"text","content":"Het verhaal van een houten pop die mens wil worden","order":0}]'
WHERE title = 'The Tale of Pinocchio';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000026","type":"text","content":"Een filosofische verkenning van geheugen en identiteit","order":0}]'
WHERE title = 'Scenes from a Memory';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000027","type":"text","content":"Een surrealistische reis vol onlogische situaties","order":0}]'
WHERE title = 'The Absurd Chronicles';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000028","type":"text","content":"Fysiek theater op zijn best","order":0}]'
WHERE title = 'Metamorphosis: A Body Work';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000029","type":"text","content":"Een experimentele meditatie over tijd en vergankelijkheid","order":0}]'
WHERE title = 'The Hour Glass';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000030","type":"text","content":"Shakespeares verhaal over liefde, geld en gerechtigheid","order":0}]'
WHERE title = 'The Merchant of Venice';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000031","type":"text","content":"Shakespeares meesterwerk over magie en vergeving","order":0}]'
WHERE title = 'The Tempest';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000032","type":"text","content":"Liefde en magie in het bos","order":0}]'
WHERE title = 'A Midsummer Night''s Dream';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000033","type":"text","content":"Liefde door conflict en verstandigheid","order":0}]'
WHERE title = 'The Taming of the Shrew';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000034","type":"text","content":"Molières komedie over bedrog","order":0}]'
WHERE title = 'Tartuffe';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000035","type":"text","content":"Passie en wanhoop in New Orleans","order":0}]'
WHERE title = 'A Streetcar Named Desire';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000036","type":"text","content":"De tragedie van de Amerikaanse droom","order":0}]'
WHERE title = 'Death of a Salesman';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000037","type":"text","content":"Het geweten van een stad op de proef gesteld","order":0}]'
WHERE title = 'The Visit';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000038","type":"text","content":"Een Spaanse tragedie over verboden liefde en lotsbestemming","order":0}]'
WHERE title = 'Blood Wedding';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000039","type":"text","content":"Beckett''s enigmatische stuk over wachten en bestaan","order":0}]'
WHERE title = 'Waiting for Godot';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000040","type":"text","content":"Een onheilspellend samenzijn","order":0}]'
WHERE title = 'The Birthday Party';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000041","type":"text","content":"Tom Stoppards metatheatrale komedie","order":0}]'
WHERE title = 'Rosencrantz and Guildenstern Are Dead';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000042","type":"text","content":"Een thriller over onthullende geheimen tijdens een diner","order":0}]'
WHERE title = 'An Inspector Calls';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000043","type":"text","content":"Een frisse, hedendaagse bewerking over massahysterie","order":0}]'
WHERE title = 'The Crucible: A New Vision';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000044","type":"text","content":"Het muziektheater over decadentie en donker Berlijn","order":0}]'
WHERE title = 'Cabaret';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000045","type":"text","content":"Een cynische musical over misdaad en showbizz","order":0}]'
WHERE title = 'Chicago';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000046","type":"text","content":"Een rockmusical over liefde, verlies en gemeenschap","order":0}]'
WHERE title = 'Rent';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000047","type":"text","content":"Lin-Manuel Mirandas hiphopmusical over Alexander Hamilton","order":0}]'
WHERE title = 'Hamilton';

UPDATE shows SET blocks = '[{"id":"b1a1e1a0-0001-0000-0000-000000000048","type":"text","content":"Een hedendaagse musical over verbinding en rouw","order":0}]'
WHERE title = 'Dear Evan Hansen';
