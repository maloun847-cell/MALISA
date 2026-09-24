import { incrementFor } from "./auction";
import type { Bid, Bidder, CategorySlug, ConditionNote, Database, Lot } from "./types";

/** Bump when the seed catalogue changes so existing local databases are rebuilt. */
export const SEED_VERSION = 3;

const HOUR = 3_600_000;

type SeedLot = {
  slug: string;
  title: string;
  maker: string;
  period: string;
  category: CategorySlug;
  description: string;
  image: [src: string, width: number, height: number];
  startingBid: number;
  reserve: number | null;
  estimate: [number, number];
  /** Hours relative to seeding time. */
  opensIn: number;
  closesIn: number;
  bidCount: number;
  seller: Lot["seller"];
  specs: [string, string][];
  grade: number;
  summary: string;
  notes: [key: string, label: string, detail: string, x: number, y: number][];
  provenance: [string, string][];
};

const SEED: SeedLot[] = [
  {
    slug: "celestial-globe-clock",
    title: "Gilt-brass celestial globe clock on a Pegasus stand",
    maker: "Augsburg school",
    period: "Late 16th-century style",
    category: "watches",
    description:
      "An engraved silver celestial sphere carried by a winged horse, with a gilt horizon ring and a small hour dial set into the meridian. The going train turns the sphere once a day, so the constellations stand where they would in the night sky. Offered as a single-owner lot, with a full mechanical inspection by our horology specialist.",
    image: ["/lots/celestial-globe-clock.webp", 1103, 1400],
    startingBid: 24_000,
    reserve: 36_000,
    estimate: [38_000, 52_000],
    opensIn: -96,
    closesIn: 50,
    bidCount: 14,
    seller: { name: "Kovač Private Collection", location: "Sarajevo, BA", since: 2019 },
    specs: [
      ["Height", "27.3 cm"],
      ["Sphere diameter", "14.2 cm"],
      ["Materials", "Silver, gilt brass, steel"],
      ["Movement", "Verge escapement, going train"],
      ["Last serviced", "March 2026"],
    ],
    grade: 8.4,
    summary: "Running and keeping time. Wear consistent with age; no replaced parts found.",
    notes: [
      ["a", "Hour dial", "Silvered chapter ring; light rubbing to the numerals.", 59, 29],
      ["b", "Celestial sphere", "Engraving crisp across all constellations; fine surface scratches.", 44, 40],
      ["c", "Horizon ring", "Gilding rubbed along the leading edge.", 22, 43],
      ["d", "Pegasus support", "Cast silver, no losses, old solder to the left wing.", 67, 64],
      ["e", "Base", "Original gilding; small dent to the rear rim.", 40, 86],
    ],
    provenance: [
      ["1911", "Private collection, Vienna"],
      ["1968", "By descent to the present owner's family"],
      ["2026", "Inspected and catalogued by Malisa"],
    ],
  },
  {
    slug: "chronograph-wristwatch",
    title: "Steel chronograph with tachymeter bezel",
    maker: "Swiss-made quartz",
    period: "2010s",
    category: "watches",
    description:
      "A 45 mm steel chronograph with a cream dial, three sub-dials and a blue-ringed small seconds. Worn but clean, with the original leather strap and a new battery fitted during inspection.",
    image: ["/lots/chronograph-wristwatch.webp", 960, 640],
    startingBid: 90,
    reserve: null,
    estimate: [180, 260],
    opensIn: -120,
    closesIn: 0.8,
    bidCount: 11,
    seller: { name: "Ivan Petrović", location: "Zagreb, HR", since: 2022 },
    specs: [
      ["Case", "45 mm, stainless steel"],
      ["Movement", "Quartz chronograph"],
      ["Water resistance", "100 m"],
      ["Strap", "Tan leather, original buckle"],
      ["Box & papers", "Box only"],
    ],
    grade: 7.6,
    summary: "All chronograph functions work. Light scratches to the bezel and case sides.",
    notes: [
      ["a", "Tachymeter bezel", "Hairline scratches at 12 and 2 o'clock.", 47, 40],
      ["b", "Sub-dials", "All three hands reset to zero.", 44, 66],
      ["c", "Crown & pushers", "Screw-down crown seals correctly.", 62, 63],
      ["d", "Strap", "Creasing at the buckle holes.", 20, 50],
    ],
    provenance: [
      ["2014", "Bought new, Zagreb"],
      ["2026", "Consigned by the original owner"],
    ],
  },
  {
    slug: "silver-pocket-watch",
    title: "Open-face silver pocket watch with Albert chain",
    maker: "English lever movement",
    period: "c. 1890",
    category: "watches",
    description:
      "A hallmarked silver open-face watch with a white enamel dial, Roman numerals and a subsidiary seconds. It comes with a period silver Albert chain. The movement was cleaned and regulated by our horologist.",
    image: ["/lots/silver-pocket-watch.webp", 960, 640],
    startingBid: 150,
    reserve: null,
    estimate: [300, 450],
    opensIn: -72,
    closesIn: 5,
    bidCount: 7,
    seller: { name: "Old Town Horology", location: "Ljubljana, SI", since: 2020 },
    specs: [
      ["Case", "50 mm, sterling silver"],
      ["Hallmarks", "Chester, 1891"],
      ["Movement", "Fusee lever, key-wound"],
      ["Chain", "Silver Albert, 38 cm"],
    ],
    grade: 7.9,
    summary: "Keeps time within a minute a day. Enamel has one hairline crack.",
    notes: [
      ["a", "Enamel dial", "Hairline crack running out from 5 o'clock.", 45, 60],
      ["b", "Bow & chain", "Bow tight; chain links sound.", 34, 38],
      ["c", "Case back", "Light dings; hinge closes flush.", 58, 73],
    ],
    provenance: [["1891", "Assayed at Chester"], ["2026", "Trade consignment"]],
  },
  {
    slug: "rangefinder-camera",
    title: "Compact 35 mm rangefinder with 38 mm f/1.8 lens",
    maker: "Japanese",
    period: "1970s",
    category: "cameras",
    description:
      "A compact fixed-lens rangefinder in black, with a fast 38 mm f/1.8 lens and a match-needle meter. The shutter was timed at every speed and the rangefinder patch is bright and aligned.",
    image: ["/lots/rangefinder-camera.webp", 960, 640],
    startingBid: 120,
    reserve: null,
    estimate: [220, 320],
    opensIn: -48,
    closesIn: 20,
    bidCount: 9,
    seller: { name: "Lena Hartmann", location: "Berlin, DE", since: 2021 },
    specs: [
      ["Format", "35 mm film"],
      ["Lens", "38 mm f/1.8, fixed"],
      ["Shutter", "Leaf, 1–1/500 s"],
      ["Meter", "CdS, working"],
      ["Light seals", "Replaced 2026"],
    ],
    grade: 8.2,
    summary: "Film-tested. Clean glass with no haze or fungus.",
    notes: [
      ["a", "Lens", "Clean, with light cleaning marks on the front element.", 63, 63],
      ["b", "Rangefinder window", "Patch bright and vertically aligned.", 45, 40],
      ["c", "Top plate", "Paint wear on the corners.", 30, 27],
    ],
    provenance: [["1974", "Bought new, Osaka"], ["2026", "Consigned from a Berlin collection"]],
  },
  {
    slug: "turntable-red-vinyl",
    title: "Belt-drive turntable with a coloured 7-inch pressing",
    maker: "European",
    period: "1980s",
    category: "music",
    description:
      "A belt-drive turntable with a die-cast platter and a straight tonearm, sold with a limited red-and-green 7-inch pressing. We fitted a new belt and checked speed stability at 33 and 45 RPM.",
    image: ["/lots/turntable-red-vinyl.webp", 960, 643],
    startingBid: 200,
    reserve: null,
    estimate: [350, 500],
    opensIn: -60,
    closesIn: 30,
    bidCount: 6,
    seller: { name: "Groove Archive", location: "Amsterdam, NL", since: 2018 },
    specs: [
      ["Drive", "Belt"],
      ["Speeds", "33⅓ / 45 RPM"],
      ["Wow & flutter", "0.06% (measured)"],
      ["Cartridge", "Moving magnet, new stylus"],
    ],
    grade: 8.0,
    summary: "Plays without faults. Light marks on the dust cover (not pictured).",
    notes: [
      ["a", "Record label", "Centre label intact, no spindle wear.", 35, 20],
      ["b", "Tonearm & cartridge", "New stylus; tracking force set to 1.8 g.", 49, 54],
      ["c", "Vinyl surface", "Plays with light surface noise.", 15, 55],
    ],
    provenance: [["1986", "Bought new, Rotterdam"], ["2026", "Consigned via Groove Archive"]],
  },
  {
    slug: "hollow-body-guitar",
    title: "Semi-hollow electric guitar in cherry burst",
    maker: "Korean-built",
    period: "2000s",
    category: "music",
    description:
      "A semi-hollow electric with twin humbuckers, f-holes and a trapeze-style tailpiece. It was set up by a luthier with fresh strings, and neck relief was measured before listing.",
    image: ["/lots/hollow-body-guitar.webp", 960, 640],
    startingBid: 500,
    reserve: 850,
    estimate: [900, 1_300],
    opensIn: -90,
    closesIn: 3,
    bidCount: 12,
    seller: { name: "Marco Bellini", location: "Milan, IT", since: 2017 },
    specs: [
      ["Body", "Laminated maple, semi-hollow"],
      ["Pickups", "2 × humbucker"],
      ["Scale", "24.75 in"],
      ["Fret wear", "Minimal"],
      ["Case", "Hard case included"],
    ],
    grade: 8.7,
    summary: "Plays cleanly, electronics quiet. One small finish chip on the lower bout.",
    notes: [
      ["a", "Neck pickup", "Output measured at 7.9 kΩ.", 58, 23],
      ["b", "F-hole", "Binding intact.", 40, 42],
      ["c", "Bridge & tailpiece", "Light plating wear.", 58, 70],
      ["d", "Controls", "Pots cleaned, no crackle.", 80, 66],
    ],
    provenance: [["2006", "Bought new, Milan"], ["2026", "Consigned by the original owner"]],
  },
  {
    slug: "red-portable-typewriter",
    title: "Portable typewriter in signal red",
    maker: "Riviera model",
    period: "1960s",
    category: "design",
    description:
      "A portable manual typewriter in bright red enamel with a black keyboard. The carriage, bell and ribbon advance all work, and it comes with a new ribbon.",
    image: ["/lots/red-portable-typewriter.webp", 960, 639],
    startingBid: 80,
    reserve: null,
    estimate: [180, 280],
    opensIn: -30,
    closesIn: 9,
    bidCount: 8,
    seller: { name: "Atelier Nord", location: "Copenhagen, DK", since: 2023 },
    specs: [
      ["Keyboard", "QWERTZ, 44 keys"],
      ["Pitch", "Pica"],
      ["Ribbon", "New, black/red"],
      ["Case", "Original, with key"],
    ],
    grade: 7.8,
    summary: "Types evenly. Small paint touch-up on the right side panel.",
    notes: [
      ["a", "Keyboard", "All keys return; no sticking typebars.", 38, 58],
      ["b", "Carriage", "Return lever smooth; bell rings.", 70, 40],
      ["c", "Side panel", "Touch-up about 1 cm across.", 72, 58],
    ],
    provenance: [["1965", "Sold new in Hamburg"], ["2026", "Consigned via Atelier Nord"]],
  },
  {
    slug: "leather-butterfly-chair",
    title: "Butterfly chair, saddle leather on a steel frame",
    maker: "After the 1938 BKF design",
    period: "Contemporary",
    category: "furniture",
    description:
      "A sling chair in thick vegetable-tanned saddle leather on a four-point steel rod frame. The leather has a soft, even patina. The frame breaks down flat for shipping.",
    image: ["/lots/leather-butterfly-chair.webp", 960, 641],
    startingBid: 300,
    reserve: 600,
    estimate: [650, 900],
    opensIn: -12,
    closesIn: 72,
    bidCount: 4,
    seller: { name: "Casa Mira", location: "Lyon, FR", since: 2021 },
    specs: [
      ["Dimensions", "86 × 80 × 90 cm"],
      ["Sling", "4 mm saddle leather"],
      ["Frame", "12 mm steel rod, powder-coated"],
    ],
    grade: 8.9,
    summary: "Excellent. Leather supple, no tears at the pockets.",
    notes: [
      ["a", "Leather sling", "Even patina; pockets reinforced.", 63, 70],
      ["b", "Frame", "Powder coat intact, no rust.", 74, 61],
    ],
    provenance: [["2019", "Made in Lyon"], ["2026", "Consigned by the maker's studio"]],
  },
  {
    slug: "black-task-lamp",
    title: "Counterweighted task lamp, black enamel and brass",
    maker: "Studio production",
    period: "Contemporary",
    category: "design",
    description:
      "A desk lamp with a swinging counterweighted arm, a black enamel shade and brass fittings. It has been rewired, PAT-tested and fitted with an EU plug.",
    image: ["/lots/black-task-lamp.webp", 960, 1222],
    startingBid: 60,
    reserve: null,
    estimate: [120, 180],
    opensIn: -6,
    closesIn: 96,
    bidCount: 3,
    seller: { name: "Atelier Nord", location: "Copenhagen, DK", since: 2023 },
    specs: [
      ["Height", "52 cm"],
      ["Reach", "68 cm"],
      ["Socket", "E27"],
      ["Wiring", "New, fabric-braided"],
    ],
    grade: 9.1,
    summary: "Near new. Light handling marks on the counterweight.",
    notes: [
      ["a", "Shade", "Enamel intact inside and out.", 30, 36],
      ["b", "Counterweight", "Handling marks on the knurled grip.", 82, 49],
      ["c", "Base", "Felted, weighted, stable.", 60, 84],
    ],
    provenance: [["2024", "Studio production run"], ["2026", "Consigned via Atelier Nord"]],
  },
  {
    slug: "leather-duffel",
    title: "Hand-stitched leather weekend duffel",
    maker: "Florentine workshop",
    period: "Contemporary",
    category: "fashion",
    description:
      "A roomy weekend bag in oiled full-grain leather, saddle-stitched by hand, with brass buckles and a detachable shoulder strap. It has been lightly used and conditioned before listing.",
    image: ["/lots/leather-duffel.webp", 960, 640],
    startingBid: 120,
    reserve: null,
    estimate: [260, 380],
    opensIn: -40,
    closesIn: 40,
    bidCount: 5,
    seller: { name: "Giulia Conti", location: "Florence, IT", since: 2020 },
    specs: [
      ["Dimensions", "56 × 30 × 28 cm"],
      ["Leather", "Full-grain, oiled"],
      ["Hardware", "Solid brass"],
      ["Lining", "Cotton canvas"],
    ],
    grade: 8.5,
    summary: "Good. Scuffs on the base corners, stitching intact throughout.",
    notes: [
      ["a", "Handles", "Stitching tight; wrap intact.", 40, 25],
      ["b", "Buckles", "Brass has a natural tarnish.", 55, 48],
      ["c", "End pocket", "Snap closure works.", 22, 55],
    ],
    provenance: [["2021", "Made to order, Florence"], ["2026", "Consigned by the owner"]],
  },
  {
    slug: "halo-diamond-ring",
    title: "Cushion-cut diamond halo ring in platinum",
    maker: "1.02 ct centre stone",
    period: "2000s",
    category: "jewellery",
    description:
      "A cushion-cut diamond set in a halo of round brilliants, on a platinum band with pavé shoulders. The centre stone was graded in-house, and the ring comes with an independent lab report.",
    image: ["/lots/halo-diamond-ring.webp", 960, 640],
    startingBid: 2_500,
    reserve: 4_500,
    estimate: [4_800, 6_500],
    opensIn: -50,
    closesIn: 26,
    bidCount: 10,
    seller: { name: "Maison Duval", location: "Geneva, CH", since: 2016 },
    specs: [
      ["Centre stone", "1.02 ct, cushion"],
      ["Colour / clarity", "G / VS2"],
      ["Metal", "Platinum 950"],
      ["Ring size", "EU 53 (resizable)"],
      ["Certificate", "Independent lab"],
    ],
    grade: 9.3,
    summary: "Excellent. All stones secure; light wear to the underside of the band.",
    notes: [
      ["a", "Halo setting", "All 18 melee stones secure.", 58, 45],
      ["b", "Shoulders", "Pavé intact.", 42, 50],
      ["c", "Band", "Light wear, no thinning.", 25, 55],
    ],
    provenance: [["2004", "Commissioned in Geneva"], ["2026", "Consigned via Maison Duval"]],
  },
  {
    slug: "abstract-blue-field",
    title: "Untitled (Blue Field), acrylic on canvas",
    maker: "Marta Lindqvist (b. 1984)",
    period: "2022",
    category: "art",
    description:
      "A thick, gestural abstract in cobalt, cadmium orange and white, with vertical drips that run the full height of the canvas. Signed and dated on the reverse and unframed. The work comes straight from the artist's studio.",
    image: ["/lots/abstract-blue-field.webp", 960, 549],
    startingBid: 700,
    reserve: 1_400,
    estimate: [1_500, 2_200],
    opensIn: -20,
    closesIn: 60,
    bidCount: 6,
    seller: { name: "Studio Lindqvist", location: "Stockholm, SE", since: 2022 },
    specs: [
      ["Medium", "Acrylic on canvas"],
      ["Dimensions", "100 × 70 cm"],
      ["Signed", "Verso, dated 2022"],
      ["Frame", "Unframed"],
    ],
    grade: 9.5,
    summary: "As new. Impasto stable, canvas taut.",
    notes: [
      ["a", "Impasto", "Stable, no cracking.", 30, 40],
      ["b", "Drips", "An intended part of the work.", 64, 72],
    ],
    provenance: [["2022", "Painted in Stockholm"], ["2026", "Consigned directly by the artist"]],
  },
  {
    slug: "blue-white-ewer",
    title: "Blue-and-white porcelain ewer with scrolling lotus",
    maker: "Delft-style",
    period: "18th-century taste",
    category: "ceramics",
    description:
      "A tall ewer with a pierced scroll handle and a slender spout, painted in cobalt with lotus scrolls and floral panels. A well-balanced decorative piece with even glaze.",
    image: ["/lots/blue-white-ewer.webp", 1095, 1400],
    startingBid: 1_000,
    reserve: 2_000,
    estimate: [2_200, 3_000],
    opensIn: -8,
    closesIn: 110,
    bidCount: 3,
    seller: { name: "Van der Berg Antiques", location: "Utrecht, NL", since: 2015 },
    specs: [
      ["Height", "33 cm"],
      ["Body", "Hard-paste porcelain"],
      ["Decoration", "Underglaze cobalt"],
      ["Marks", "None"],
    ],
    grade: 8.1,
    summary: "Good. Tiny frit to the spout tip; no cracks or restoration under UV.",
    notes: [
      ["a", "Handle", "Pierced scroll intact.", 42, 22],
      ["b", "Spout", "0.5 mm frit to the tip.", 72, 34],
      ["c", "Body", "Glaze even, no crazing.", 46, 60],
      ["d", "Foot rim", "Unglazed, with light kiln grit.", 49, 88],
    ],
    provenance: [["1930s", "Dutch private collection"], ["2026", "Consigned via Van der Berg"]],
  },
  {
    slug: "gilt-fauteuil",
    title: "Louis XVI-style giltwood fauteuil with silk upholstery",
    maker: "French",
    period: "19th century",
    category: "furniture",
    description:
      "A square-backed armchair with carved ribbon-and-rosette crest rails, fluted tapering legs and an embroidered silk cover. The gilding is old and softly worn. The seat was re-webbed recently.",
    image: ["/lots/gilt-fauteuil.webp", 1400, 1400],
    startingBid: 1_800,
    reserve: 3_200,
    estimate: [3_500, 5_000],
    opensIn: -4,
    closesIn: 130,
    bidCount: 2,
    seller: { name: "Galerie Moreau", location: "Paris, FR", since: 2014 },
    specs: [
      ["Dimensions", "98 × 64 × 58 cm"],
      ["Frame", "Carved beech, gilt"],
      ["Upholstery", "Embroidered silk, later"],
      ["Structure", "Joints tight, re-webbed"],
    ],
    grade: 7.7,
    summary: "Good. Gilding worn at the arm terminals, which is typical for the period.",
    notes: [
      ["a", "Crest rail", "Carving crisp, one small loss to the ribbon.", 62, 12],
      ["b", "Back panel", "Silk sound, slight fading.", 65, 32],
      ["c", "Arm terminal", "Gilding worn to the gesso.", 22, 35],
      ["d", "Legs", "Fluting crisp; feet slightly shortened.", 36, 84],
    ],
    provenance: [["c. 1870", "Paris"], ["1990s", "Private collection, Lyon"], ["2026", "Consigned via Galerie Moreau"]],
  },
  {
    slug: "vintage-coupe",
    title: "Two-door coupe in sapphire blue, restored",
    maker: "American",
    period: "1950s",
    category: "vehicles",
    description:
      "A chrome-bumpered two-door coupe with an older respray in sapphire blue, a rebuilt straight-six and new brakes. Registered in the EU and road legal, with a folder of restoration invoices.",
    image: ["/lots/vintage-coupe.webp", 960, 639],
    startingBid: 8_000,
    reserve: 13_500,
    estimate: [14_000, 19_000],
    opensIn: -24,
    closesIn: 150,
    bidCount: 9,
    seller: { name: "Autoklasik", location: "Mostar, BA", since: 2019 },
    specs: [
      ["Engine", "Inline six, rebuilt 2023"],
      ["Transmission", "3-speed manual"],
      ["Odometer", "58,420 mi (unwarranted)"],
      ["Registration", "EU, historic plates"],
    ],
    grade: 7.4,
    summary: "Solid driver. Paint shows small blemishes; floors sound.",
    notes: [
      ["a", "Paint", "Older respray; small chips on the rear wing.", 28, 40],
      ["b", "Tail light", "Lens original, no cracks.", 44, 58],
      ["c", "Bumper", "Chrome pitted at the corners.", 20, 82],
    ],
    provenance: [["1956", "Delivered in Detroit"], ["1998", "Imported to Europe"], ["2026", "Consigned via Autoklasik"]],
  },
  {
    slug: "steel-road-bicycle",
    title: "Lugged steel road bicycle, 56 cm",
    maker: "Italian-style",
    period: "1980s",
    category: "vehicles",
    description:
      "A lugged steel road frame in pale blue with downtube shifters, a period groupset and new tyres and bar tape. It was serviced and ridden 20 km before listing.",
    image: ["/lots/steel-road-bicycle.webp", 960, 640],
    startingBid: 200,
    reserve: null,
    estimate: [450, 650],
    opensIn: -170,
    closesIn: -6,
    bidCount: 13,
    seller: { name: "Velo Vintage", location: "Vienna, AT", since: 2018 },
    specs: [
      ["Frame", "56 cm, lugged steel"],
      ["Groupset", "Period 2 × 6"],
      ["Wheels", "700c, new tyres"],
      ["Weight", "10.4 kg"],
    ],
    grade: 8.0,
    summary: "Ride-ready. Paint chips on the chainstay.",
    notes: [
      ["a", "Saddle", "Leather, broken in.", 38, 22],
      ["b", "Drivetrain", "Chain new; shifting indexed.", 46, 66],
      ["c", "Bars", "New cork tape.", 67, 30],
    ],
    provenance: [["1984", "Built in Treviso"], ["2026", "Consigned via Velo Vintage"]],
  },
  {
    slug: "porcelain-teapot",
    title: "Transfer-printed creamware teapot with pagoda scene",
    maker: "English",
    period: "c. 1770",
    category: "ceramics",
    description:
      "A globular teapot printed in underglaze blue with a pagoda and willow scene, with a crabstock spout and a loop handle. The lid is present, and the piece is small, light and well potted.",
    image: ["/lots/porcelain-teapot.webp", 1400, 1045],
    startingBid: 350,
    reserve: null,
    estimate: [700, 1_000],
    opensIn: 20,
    closesIn: 192,
    bidCount: 0,
    seller: { name: "Van der Berg Antiques", location: "Utrecht, NL", since: 2015 },
    specs: [
      ["Height", "14 cm"],
      ["Body", "Creamware"],
      ["Decoration", "Underglaze blue print"],
      ["Lid", "Original"],
    ],
    grade: 8.3,
    summary: "Good. Old glued chip to the lid flange, visible only when the lid is off.",
    notes: [
      ["a", "Lid", "Glued chip to the flange.", 54, 30],
      ["b", "Spout", "Intact.", 26, 40],
      ["c", "Print", "Crisp transfer, even firing.", 56, 58],
      ["d", "Handle", "No cracks at the terminals.", 76, 40],
    ],
    provenance: [["c. 1770", "Staffordshire"], ["2026", "Consigned via Van der Berg"]],
  },
];

const BIDDERS: Bidder[] = [
  "Amra Kovačević", "Luka Novak", "Sofia Rossi", "Jonas Weber", "Emma Janssen",
  "Tarik Hadžić", "Nina Horvat", "Oskar Lind", "Claire Martin", "Mateo García",
  "Hana Begić", "Felix Bauer", "Ines Moreau", "Marko Jurić", "Lea Schmid",
].map((name, i) => ({
  paddle: 1101 + i * 7,
  name,
  email: `${name.split(" ")[0].toLowerCase()}@example.com`,
  createdAt: new Date(0).toISOString(),
}));

/** Small deterministic PRNG so the seeded bid history is stable between runs. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedBids(lotId: string, seed: SeedLot, lotIndex: number, opened: number, until: number): Bid[] {
  const rand = prng(lotIndex * 7919 + 17);
  const bids: Bid[] = [];
  let amount = seed.startingBid;
  let lastPaddle = -1;
  for (let i = 0; i < seed.bidCount; i++) {
    if (i > 0) amount += incrementFor(amount) * (1 + Math.floor(rand() * 3));
    let bidder = BIDDERS[Math.floor(rand() * BIDDERS.length)];
    if (bidder.paddle === lastPaddle) bidder = BIDDERS[(BIDDERS.indexOf(bidder) + 1) % BIDDERS.length];
    lastPaddle = bidder.paddle;
    const at = opened + ((until - opened) * (i + 1)) / (seed.bidCount + 1);
    bids.push({
      id: `${lotId}-b${i + 1}`,
      lotId,
      paddle: bidder.paddle,
      bidder: bidder.name,
      amount,
      at: new Date(at).toISOString(),
    });
  }
  return bids.reverse();
}

function toNotes(notes: SeedLot["notes"]): ConditionNote[] {
  return notes.map(([key, label, detail, x, y]) => ({ key, label, detail, x, y }));
}

export function buildSeed(now: number = Date.now()): Database {
  const lots: Lot[] = SEED.map((s, i) => {
    const startsAt = now + s.opensIn * HOUR;
    const endsAt = now + s.closesIn * HOUR;
    const lastBidAt = Math.min(now - 60_000, endsAt - 60_000);
    return {
      id: s.slug,
      number: i + 1,
      title: s.title,
      maker: s.maker,
      period: s.period,
      category: s.category,
      description: s.description,
      image: { src: s.image[0], width: s.image[1], height: s.image[2] },
      startingBid: s.startingBid,
      reserve: s.reserve,
      estimate: s.estimate,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      seller: s.seller,
      specs: s.specs.map(([label, value]) => ({ label, value })),
      condition: { grade: s.grade, summary: s.summary, notes: toNotes(s.notes) },
      provenance: s.provenance.map(([year, event]) => ({ year, event })),
      bids: startsAt < now ? seedBids(s.slug, s, i, startsAt, lastBidAt) : [],
      createdAt: new Date(startsAt - 24 * HOUR).toISOString(),
    };
  });
  return { version: SEED_VERSION, lots, bidders: [...BIDDERS] };
}
