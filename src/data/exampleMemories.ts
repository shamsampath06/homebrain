import { FamilyMemory } from '../types';

export const EXAMPLE_PLACE_FOLDERS = [
  'Paris, France',
  'Kyoto, Japan',
  'Santorini, Greece',
  'Swiss Alps, Switzerland',
  'Manali, Himachal Pradesh',
  'Bali, Indonesia'
] as const;

export const EXAMPLE_PLACE_MEMORIES: FamilyMemory[] = [
  // ── 1. Paris, France (3 photos) ──────────────────────────────
  {
    id: 'demo-mem-paris-1',
    title: 'Eiffel Tower Sunset Picnic',
    year: 2025,
    date: '2025-07-14',
    description: 'Golden hour picnic at Champ de Mars watching the Eiffel Tower shimmer as dusk fell over Paris.',
    photoUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80'],
    location: 'Paris, France',
    addedBy: 'Sarah',
    taggedMembers: ['Sarah', 'Mother', 'Father'],
    tags: ['paris', 'france', 'eiffeltower', 'picnic', 'sunset'],
    album: 'Paris, France'
  },
  {
    id: 'demo-mem-paris-2',
    title: 'Louvre Museum Courtyard & Pyramid',
    year: 2025,
    date: '2025-07-16',
    description: 'Evening stroll around the glass pyramid of the Musée du Louvre after exploring world art masterpieces.',
    photoUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'],
    location: 'Paris, France',
    addedBy: 'Father',
    taggedMembers: ['Father', 'Sneha', 'Sham'],
    tags: ['louvre', 'museum', 'paris', 'art', 'france'],
    album: 'Paris, France'
  },
  {
    id: 'demo-mem-paris-3',
    title: 'Seine River Promenade & Cafés',
    year: 2025,
    date: '2025-07-18',
    description: 'Walking across Parisian bridges and enjoying fresh buttery croissants and café au lait by the river.',
    photoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'],
    location: 'Paris, France',
    addedBy: 'Mother',
    taggedMembers: ['Mother', 'Father', 'Sarah', 'Sham'],
    tags: ['seine', 'cafe', 'croissants', 'paris', 'travel'],
    album: 'Paris, France'
  },

  // ── 2. Kyoto, Japan (3 photos) ───────────────────────────────
  {
    id: 'demo-mem-kyoto-1',
    title: 'Higashiyama Streets & Yasaka Pagoda',
    year: 2024,
    date: '2024-10-12',
    description: 'Strolling through historic cobblestone lanes of Kyoto with the timeless Yasaka pagoda towering above.',
    photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'],
    location: 'Kyoto, Japan',
    addedBy: 'Sham',
    taggedMembers: ['Sham', 'Sarah', 'Father'],
    tags: ['kyoto', 'japan', 'pagoda', 'asia', 'culture'],
    album: 'Kyoto, Japan'
  },
  {
    id: 'demo-mem-kyoto-2',
    title: 'Zen Rock Garden & Wooden Pavilion',
    year: 2024,
    date: '2024-10-14',
    description: 'Serene morning tea ceremony in a centuries-old wooden pavilion surrounded by raked stone gardens.',
    photoUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80'],
    location: 'Kyoto, Japan',
    addedBy: 'Sneha',
    taggedMembers: ['Sneha', 'Mother'],
    tags: ['zen', 'garden', 'temple', 'kyoto', 'japan'],
    album: 'Kyoto, Japan'
  },
  {
    id: 'demo-mem-kyoto-3',
    title: 'Fushimi Inari Shrine Torii Gates',
    year: 2024,
    date: '2024-10-16',
    description: 'Hike through thousands of bright vermilion torii gates stretching along the forested mountain pathway.',
    photoUrl: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&q=80'],
    location: 'Kyoto, Japan',
    addedBy: 'Sarah',
    taggedMembers: ['Sarah', 'Sham', 'Father', 'Mother'],
    tags: ['fushimiinari', 'torii', 'shrine', 'kyoto', 'japan'],
    album: 'Kyoto, Japan'
  },

  // ── 3. Santorini, Greece (2 photos) ──────────────────────────
  {
    id: 'demo-mem-santorini-1',
    title: 'Oia Blue Dome & Aegean Vista',
    year: 2024,
    date: '2024-06-20',
    description: 'Breathtaking contrast of whitewashed villas and blue church domes overlooking the sparkling Aegean Sea.',
    photoUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80'],
    location: 'Santorini, Greece',
    addedBy: 'Mother',
    taggedMembers: ['Mother', 'Father', 'Sarah'],
    tags: ['santorini', 'greece', 'aegean', 'oia', 'islands'],
    album: 'Santorini, Greece'
  },
  {
    id: 'demo-mem-santorini-2',
    title: 'Caldera Sunset Golden Hour',
    year: 2024,
    date: '2024-06-22',
    description: 'Spectacular sunset painting the volcanic cliffside with deep amber, peach, and violet colors.',
    photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80'],
    location: 'Santorini, Greece',
    addedBy: 'Father',
    taggedMembers: ['Father', 'Mother', 'Sneha', 'Sham'],
    tags: ['sunset', 'caldera', 'santorini', 'greece', 'vacation'],
    album: 'Santorini, Greece'
  },

  // ── 4. Swiss Alps, Switzerland (3 photos) ────────────────────
  {
    id: 'demo-mem-swiss-1',
    title: 'Matterhorn Alpine Sunrise Peak',
    year: 2023,
    date: '2023-12-28',
    description: 'Waking up early in Zermatt to witness morning alpenglow lighting the iconic pyramid summit of the Matterhorn.',
    photoUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80'],
    location: 'Swiss Alps, Switzerland',
    addedBy: 'Sarah',
    taggedMembers: ['Sarah', 'Father', 'Sham'],
    tags: ['swissalps', 'switzerland', 'matterhorn', 'snow', 'winter'],
    album: 'Swiss Alps, Switzerland'
  },
  {
    id: 'demo-mem-swiss-2',
    title: 'Alpine Valley Lake & Pine Chalet',
    year: 2023,
    date: '2023-12-30',
    description: 'Mirror-still mountain lake reflecting snow-dusted pine forests and traditional Swiss wooden chalets.',
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
    location: 'Swiss Alps, Switzerland',
    addedBy: 'Father',
    taggedMembers: ['Father', 'Mother', 'Sneha'],
    tags: ['alpinelake', 'chalet', 'valley', 'switzerland'],
    album: 'Swiss Alps, Switzerland'
  },
  {
    id: 'demo-mem-swiss-3',
    title: 'High Mountain Trail & Cloud Vista',
    year: 2024,
    date: '2024-01-02',
    description: 'Panoramic mountain trek walking above fluffy sea of clouds with crisp mountain air.',
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
    location: 'Swiss Alps, Switzerland',
    addedBy: 'Sham',
    taggedMembers: ['Sham', 'Sarah', 'Father', 'Mother'],
    tags: ['hiking', 'glacier', 'trail', 'swissalps', 'adventure'],
    album: 'Swiss Alps, Switzerland'
  },

  // ── 5. Manali, Himachal Pradesh (2 photos) ───────────────────
  {
    id: 'demo-mem-manali-1',
    title: 'Rohtang Pass Snow Adventure',
    year: 2024,
    date: '2024-03-24',
    description: 'Family snowball fight and snow sledging atop the majestic high-altitude pass of Rohtang.',
    photoUrl: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80'],
    location: 'Manali, Himachal Pradesh',
    addedBy: 'Sarah',
    taggedMembers: ['Sarah', 'Mother', 'Father', 'Sham', 'Sneha'],
    tags: ['manali', 'himachal', 'rohtang', 'snow', 'himalayas'],
    album: 'Manali, Himachal Pradesh'
  },
  {
    id: 'demo-mem-manali-2',
    title: 'Beas Riverbank & Deodar Woods',
    year: 2024,
    date: '2024-03-26',
    description: 'Resting by the clear turquoise waters of the Beas River surrounded by giant cedar trees.',
    photoUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'],
    location: 'Manali, Himachal Pradesh',
    addedBy: 'Father',
    taggedMembers: ['Father', 'Mother'],
    tags: ['beasriver', 'woods', 'manali', 'himachal', 'nature'],
    album: 'Manali, Himachal Pradesh'
  },

  // ── 6. Bali, Indonesia (3 photos) ────────────────────────────
  {
    id: 'demo-mem-bali-1',
    title: 'Tegalalang Emerald Rice Terraces',
    year: 2023,
    date: '2023-09-15',
    description: 'Exploring the stepped tropical green hills and palm trees of Ubud in the cool morning breeze.',
    photoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'],
    location: 'Bali, Indonesia',
    addedBy: 'Sneha',
    taggedMembers: ['Sneha', 'Sarah', 'Sham'],
    tags: ['bali', 'indonesia', 'riceterraces', 'ubud', 'tropical'],
    album: 'Bali, Indonesia'
  },
  {
    id: 'demo-mem-bali-2',
    title: 'Seminyak Beach Sunset & Palms',
    year: 2023,
    date: '2023-09-17',
    description: 'Watching waves roll in as the tropical sunset lights up the sky in vibrant shades of magenta and gold.',
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
    location: 'Bali, Indonesia',
    addedBy: 'Mother',
    taggedMembers: ['Mother', 'Father', 'Sneha', 'Sarah', 'Sham'],
    tags: ['beach', 'sunset', 'ocean', 'bali', 'indonesia'],
    album: 'Bali, Indonesia'
  },
  {
    id: 'demo-mem-bali-3',
    title: 'Ulun Danu Beratan Water Temple',
    year: 2023,
    date: '2023-09-19',
    description: 'The ancient Hindu temple rising from Lake Beratan with misty volcano peaks in the backdrop.',
    photoUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
    photoUrls: ['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'],
    location: 'Bali, Indonesia',
    addedBy: 'Sarah',
    taggedMembers: ['Sarah', 'Mother', 'Father'],
    tags: ['temple', 'lake', 'culture', 'bali', 'indonesia'],
    album: 'Bali, Indonesia'
  }
];

