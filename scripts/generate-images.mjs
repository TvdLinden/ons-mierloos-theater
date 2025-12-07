import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../public/uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Color palette for different show genres
const colors = {
  hamlet: '#2C3E50', // Dark blue-gray
  'glass-menagerie': '#95A5A6', // Light gray
  ghosts: '#34495E', // Dark slate
  'dolls-house': '#E74C3C', // Red
  crucible: '#C0392B', // Dark red
  'importance-earnest': '#F39C12', // Orange
  'much-ado': '#F1C40F', // Yellow
  'twelfth-night': '#3498DB', // Blue
  'noises-off': '#9B59B6', // Purple
  'one-liners': '#E67E22', // Dark orange
  'les-miserables': '#C0392B', // Dark red
  phantom: '#2C3E50', // Dark blue
  evita: '#E74C3C', // Red
  'west-side': '#E67E22', // Orange
  'sweeney-todd': '#34495E', // Dark slate
  'swan-lake': '#3498DB', // Blue
  nutcracker: '#F39C12', // Orange
  giselle: '#9B59B6', // Purple
  contemporary: '#1ABC9C', // Turquoise
  stomp: '#2C3E50', // Dark blue
  cinderella: '#E91E63', // Pink
  'lion-king': '#F39C12', // Orange
  frozen: '#3498DB', // Blue
  'peter-pan': '#27AE60', // Green
  pinocchio: '#E67E22', // Orange
  scenes: '#9B59B6', // Purple
  absurd: '#34495E', // Dark slate
  metamorphosis: '#1ABC9C', // Turquoise
  'hour-glass': '#95A5A6', // Gray
  merchant: '#16A085', // Teal
  tempest: '#2980B9', // Darker blue
  midsummer: '#27AE60', // Green
  taming: '#E74C3C', // Red
  tartuffe: '#F39C12', // Orange
  streetcar: '#C0392B', // Dark red
  'death-salesman': '#34495E', // Dark slate
  'the-visit': '#95A5A6', // Gray
  'blood-wedding': '#C0392B', // Dark red
  'waiting-godot': '#7F8C8D', // Dark gray
  'birthday-party': '#2C3E50', // Dark blue
  rosencrantz: '#34495E', // Dark slate
  'inspector-calls': '#16A085', // Teal
  'crucible-new-vision': '#C0392B', // Dark red
  cabaret: '#8B0000', // Dark red
  chicago: '#1C1C1C', // Black
  rent: '#E91E63', // Pink
  hamilton: '#FFD700', // Gold
  'dear-evan': '#3498DB', // Blue
};

// Show image mapping (filename without extension -> base color)
const showImages = [
  { main: 'hamlet-main.jpg', thumb: 'hamlet-thumb.jpg', show: 'hamlet' },
  { main: 'glass-menagerie-main.jpg', thumb: 'glass-menagerie-thumb.jpg', show: 'glass-menagerie' },
  { main: 'ghosts-main.jpg', thumb: 'ghosts-thumb.jpg', show: 'ghosts' },
  { main: 'dolls-house-main.jpg', thumb: 'dolls-house-thumb.jpg', show: 'dolls-house' },
  { main: 'crucible-main.jpg', thumb: 'crucible-thumb.jpg', show: 'crucible' },
  {
    main: 'importance-earnest-main.jpg',
    thumb: 'importance-earnest-thumb.jpg',
    show: 'importance-earnest',
  },
  { main: 'much-ado-main.jpg', thumb: 'much-ado-thumb.jpg', show: 'much-ado' },
  { main: 'twelfth-night-main.jpg', thumb: 'twelfth-night-thumb.jpg', show: 'twelfth-night' },
  { main: 'noises-off-main.jpg', thumb: 'noises-off-thumb.jpg', show: 'noises-off' },
  { main: 'one-liners-main.jpg', thumb: 'one-liners-thumb.jpg', show: 'one-liners' },
  { main: 'les-miserables-main.jpg', thumb: 'les-miserables-thumb.jpg', show: 'les-miserables' },
  { main: 'phantom-opera-main.jpg', thumb: 'phantom-opera-thumb.jpg', show: 'phantom' },
  { main: 'evita-main.jpg', thumb: 'evita-thumb.jpg', show: 'evita' },
  { main: 'west-side-story-main.jpg', thumb: 'west-side-story-thumb.jpg', show: 'west-side' },
  { main: 'sweeney-todd-main.jpg', thumb: 'sweeney-todd-thumb.jpg', show: 'sweeney-todd' },
  { main: 'swan-lake-main.jpg', thumb: 'swan-lake-thumb.jpg', show: 'swan-lake' },
  { main: 'nutcracker-main.jpg', thumb: 'nutcracker-thumb.jpg', show: 'nutcracker' },
  { main: 'giselle-main.jpg', thumb: 'giselle-thumb.jpg', show: 'giselle' },
  {
    main: 'contemporary-fusion-main.jpg',
    thumb: 'contemporary-fusion-thumb.jpg',
    show: 'contemporary',
  },
  { main: 'stomp-main.jpg', thumb: 'stomp-thumb.jpg', show: 'stomp' },
  { main: 'cinderella-main.jpg', thumb: 'cinderella-thumb.jpg', show: 'cinderella' },
  { main: 'lion-king-main.jpg', thumb: 'lion-king-thumb.jpg', show: 'lion-king' },
  { main: 'frozen-main.jpg', thumb: 'frozen-thumb.jpg', show: 'frozen' },
  { main: 'peter-pan-main.jpg', thumb: 'peter-pan-thumb.jpg', show: 'peter-pan' },
  { main: 'pinocchio-main.jpg', thumb: 'pinocchio-thumb.jpg', show: 'pinocchio' },
  { main: 'scenes-memory-main.jpg', thumb: 'scenes-memory-thumb.jpg', show: 'scenes' },
  { main: 'absurd-chronicles-main.jpg', thumb: 'absurd-chronicles-thumb.jpg', show: 'absurd' },
  { main: 'metamorphosis-main.jpg', thumb: 'metamorphosis-thumb.jpg', show: 'metamorphosis' },
  { main: 'hour-glass-main.jpg', thumb: 'hour-glass-thumb.jpg', show: 'hour-glass' },
  { main: 'merchant-venice-main.jpg', thumb: 'merchant-venice-thumb.jpg', show: 'merchant' },
  { main: 'tempest-main.jpg', thumb: 'tempest-thumb.jpg', show: 'tempest' },
  { main: 'midsummer-night-main.jpg', thumb: 'midsummer-night-thumb.jpg', show: 'midsummer' },
  { main: 'taming-shrew-main.jpg', thumb: 'taming-shrew-thumb.jpg', show: 'taming' },
  { main: 'tartuffe-main.jpg', thumb: 'tartuffe-thumb.jpg', show: 'tartuffe' },
  { main: 'streetcar-desire-main.jpg', thumb: 'streetcar-desire-thumb.jpg', show: 'streetcar' },
  { main: 'death-salesman-main.jpg', thumb: 'death-salesman-thumb.jpg', show: 'death-salesman' },
  { main: 'the-visit-main.jpg', thumb: 'the-visit-thumb.jpg', show: 'the-visit' },
  { main: 'blood-wedding-main.jpg', thumb: 'blood-wedding-thumb.jpg', show: 'blood-wedding' },
  { main: 'waiting-godot-main.jpg', thumb: 'waiting-godot-thumb.jpg', show: 'waiting-godot' },
  { main: 'birthday-party-main.jpg', thumb: 'birthday-party-thumb.jpg', show: 'birthday-party' },
  {
    main: 'rosencrantz-guildenstern-main.jpg',
    thumb: 'rosencrantz-guildenstern-thumb.jpg',
    show: 'rosencrantz',
  },
  { main: 'inspector-calls-main.jpg', thumb: 'inspector-calls-thumb.jpg', show: 'inspector-calls' },
  {
    main: 'crucible-new-vision-main.jpg',
    thumb: 'crucible-new-vision-thumb.jpg',
    show: 'crucible-new-vision',
  },
  { main: 'cabaret-main.jpg', thumb: 'cabaret-thumb.jpg', show: 'cabaret' },
  { main: 'chicago-main.jpg', thumb: 'chicago-thumb.jpg', show: 'chicago' },
  { main: 'rent-main.jpg', thumb: 'rent-thumb.jpg', show: 'rent' },
  { main: 'hamilton-main.jpg', thumb: 'hamilton-thumb.jpg', show: 'hamilton' },
  { main: 'dear-evan-hansen-main.jpg', thumb: 'dear-evan-hansen-thumb.jpg', show: 'dear-evan' },
];

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 200, g: 200, b: 200 };
}

// Generate a minimal JPEG from a flat color
async function generateFlatColorJPEG(width, height, hexColor) {
  const rgb = hexToRgb(hexColor);
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: rgb.r, g: rgb.g, b: rgb.b },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
} // Main generation function
async function generateImages() {
  console.log('Generating flat color JPEG images...\n');

  let generated = 0;
  let failed = 0;

  for (const img of showImages) {
    try {
      // Generate main image (larger)
      const mainColor = colors[img.show] || '#95A5A6';
      const mainBuffer = await generateFlatColorJPEG(800, 600, mainColor);
      fs.writeFileSync(path.join(uploadsDir, img.main), mainBuffer);
      console.log(`✓ Generated ${img.main}`);
      generated++;

      // Generate thumbnail (smaller)
      const thumbBuffer = await generateFlatColorJPEG(400, 300, mainColor);
      fs.writeFileSync(path.join(uploadsDir, img.thumb), thumbBuffer);
      console.log(`✓ Generated ${img.thumb}`);
      generated++;
    } catch (error) {
      console.error(`✗ Failed to generate ${img.main}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✓ Successfully generated ${generated} images`);
  if (failed > 0) {
    console.log(`✗ Failed to generate ${failed} images`);
  }
}

generateImages().catch(console.error);
