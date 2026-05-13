require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Space = require('../models/Space');

const CATEGORIES = [
  { name: 'Apartments', icon: 'home-outline', description: 'Residential apartments and flats', color: '#8B5CF6' },
  { name: 'Villas', icon: 'home', description: 'Luxury villas and houses', color: '#A78BFA' },
  { name: 'Rooftops', icon: 'sunny-outline', description: 'Rooftops and terraces', color: '#DDD6FE' },
  { name: 'Farmhouses', icon: 'leaf-outline', description: 'Farmhouses and countryside properties', color: '#D9F99D' },
  { name: 'Hotel & Resort', icon: 'umbrella-outline', description: 'Hotels and resorts', color: '#2DD4BF' },
  { name: 'Gardens', icon: 'flower-outline', description: 'Garden spaces and lawns', color: '#4ADE80' },
  { name: 'Lawns', icon: 'leaf', description: 'Open lawn spaces', color: '#86EFAC' },
  { name: 'Open Grounds', icon: 'football-outline', description: 'Open grounds and fields', color: '#A3E635' },
  { name: 'Meeting Rooms', icon: 'people-outline', description: 'Meeting rooms and conference spaces', color: '#7C3AED' },
  { name: 'Coworking', icon: 'laptop-outline', description: 'Coworking desks and offices', color: '#6366F1' },
  { name: 'Private Offices', icon: 'lock-closed-outline', description: 'Private office spaces', color: '#4F46E5' },
  { name: 'Workshop Rooms', icon: 'construct-outline', description: 'Workshop and tuition rooms', color: '#06B6D4' },
  { name: 'Banquet Halls', icon: 'gift-outline', description: 'Banquet and party halls', color: '#EC4899' },
  { name: 'Wedding Venues', icon: 'heart-outline', description: 'Wedding and engagement venues', color: '#F472B6' },
  { name: 'Party Halls', icon: 'happy-outline', description: 'Party and celebration spaces', color: '#DB2777' },
  { name: 'Clubs & Lounges', icon: 'wine-outline', description: 'Clubs, lounges and poolside venues', color: '#BE185D' },
  { name: 'Home Theatres', icon: 'film-outline', description: 'Home theatre and screening rooms', color: '#831843' },
  { name: 'Gaming Rooms', icon: 'game-controller-outline', description: 'Gaming and VR rooms', color: '#701A75' },
  { name: 'Gym', icon: 'accessibility-outline', description: 'Gyms and fitness centers', color: '#F43F5E' },
  { name: 'Yoga Studios', icon: 'fitness-outline', description: 'Yoga and meditation studios', color: '#E11D48' },
  { name: 'Sports Rooms', icon: 'basketball-outline', description: 'Indoor courts and sports facilities', color: '#BE123C' },
  { name: 'Private Pools', icon: 'people-outline', description: 'Private swimming pools', color: '#F87171' },
  { name: 'Photo & Video Studios', icon: 'camera-outline', description: 'Photo and video shooting studios', color: '#EF4444' },
  { name: 'Production Studios & Sets', icon: 'videocam-outline', description: 'Production studios and sets', color: '#F59E0B' },
  { name: 'Studios', icon: 'radio-outline', description: 'Photo, podcast and recording studios', color: '#DC2626' },
  { name: 'Content Creator', icon: 'images-outline', description: 'Content creator and shooting spaces', color: '#B91C1C' },
  { name: 'Showrooms', icon: 'storefront', description: 'Showrooms and exhibition booths', color: '#92400E' },
  { name: 'Dating Spots', icon: 'heart', description: 'Private date and hangout spaces', color: '#F9A8D4' },
  { name: 'Parking Spaces', icon: 'car-outline', description: 'Parking spaces and garages', color: '#64748B' },
];

const SAMPLE_SPACES = [
  {
    title: 'Modern Downtown Loft',
    description: 'A beautiful modern loft in the heart of Mumbai with stunning city views. Perfect for professionals and small families.',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    category: 'Apartments',
    location: { address: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.0522, lng: 72.8296 } },
    price: 500,
    priceType: 'hourly',
    amenities: ['wifi', 'ac', 'parking', 'power_backup', 'furniture', 'cctv'],
    featured: true,
    rating: 4.8,
    reviewCount: 24
  },
  {
    title: 'Luxurious Penthouse Suite',
    description: 'Experience luxury living in this sprawling penthouse with private terrace and panoramic city views.',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    category: 'Villas',
    location: { address: 'MG Road', city: 'Bangalore', state: 'Karnataka', coordinates: { lat: 12.9750, lng: 77.6060 } },
    price: 1500,
    priceType: 'hourly',
    amenities: ['wifi', 'ac', 'parking', 'power_backup', 'lift', 'security', 'cctv', 'furniture'],
    featured: true,
    rating: 5.0,
    reviewCount: 12
  },
  {
    title: 'Professional Coworking Space',
    description: 'Fully equipped coworking space with meeting rooms, high-speed internet, and professional environment.',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    category: 'Coworking',
    location: { address: 'Connaught Place', city: 'Delhi', state: 'Delhi', coordinates: { lat: 28.6315, lng: 77.2167 } },
    price: 2000,
    priceType: 'hourly',
    amenities: ['wifi', 'ac', 'power_backup', 'lift', 'security', 'cctv', 'printer', 'phone'],
    featured: true,
    rating: 4.7,
    reviewCount: 32
  },
  {
    title: 'Corporate Meeting Room',
    description: 'Spacious meeting room equipped with audio-visual facilities, perfect for client presentations.',
    images: ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'],
    category: 'Meeting Rooms',
    location: { address: 'Bandra Kurla Complex', city: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.0637, lng: 72.8657 } },
    price: 1500,
    priceType: 'hourly',
    amenities: ['wifi', 'ac', 'projector', 'whiteboard', 'phone', 'cctv'],
    rating: 4.6,
    reviewCount: 28
  },
  {
    title: 'Grand Wedding Banquet Hall',
    description: 'Magnificent banquet hall with elegant décor, capable of hosting grand weddings and large-scale events.',
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'],
    category: 'Banquet Halls',
    location: { address: 'MI Road', city: 'Jaipur', state: 'Rajasthan', coordinates: { lat: 26.9124, lng: 75.7873 } },
    price: 10000,
    priceType: 'hourly',
    amenities: ['parking', 'ac', 'power_backup', 'cctv', 'security', 'furniture'],
    featured: true,
    rating: 4.9,
    reviewCount: 15
  },
  {
    title: 'Premium Fitness Center',
    description: 'State-of-the-art gym with latest equipment and personal trainers available.',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'],
    category: 'Gym',
    location: { address: 'Karol Bagh', city: 'Delhi', state: 'Delhi', coordinates: { lat: 28.6500, lng: 77.1900 } },
    price: 300,
    priceType: 'hourly',
    amenities: ['ac', 'parking', 'water', 'cctv', 'security'],
    rating: 4.5,
    reviewCount: 67
  },
  {
    title: 'Yoga Studio Space',
    description: 'Serene yoga studio with natural lighting, wooden floors, and peaceful atmosphere.',
    images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800'],
    category: 'Yoga Studios',
    location: { address: 'Lakshman Jhula', city: 'Rishikesh', state: 'Uttarakhand', coordinates: { lat: 30.1089, lng: 78.3296 } },
    price: 200,
    priceType: 'hourly',
    amenities: ['water', 'toilet', 'parking'],
    rating: 4.9,
    reviewCount: 33
  },
  {
    title: 'Photo Studio with Props',
    description: 'Professional photo studio with diverse props, lighting setups, and backdrops.',
    images: ['https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800'],
    category: 'Studios',
    location: { address: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.1197, lng: 72.8468 } },
    price: 500,
    priceType: 'hourly',
    amenities: ['wifi', 'ac', 'power_backup', 'cctv'],
    featured: true,
    rating: 4.7,
    reviewCount: 29
  },

];

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await Category.deleteMany({});
    const categories = await Category.insertMany(CATEGORIES);
    console.log(`Created ${categories.length} categories`);
    const categoryMap = new Map(categories.map(c => [c.name, c._id]));
    const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@posompa.com';
    const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'changeme';
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      adminUser = new User({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: 'PosomePa Admin',
        role: 'admin',
        phone: process.env.SEED_ADMIN_PHONE || '+919999999999'
      });
      await adminUser.save();
      console.log('Created admin user');
    } else {
      console.log('Admin user already exists');
    }
    await Space.deleteMany({});
    const spacesToCreate = SAMPLE_SPACES.map(space => ({
      ...space,
      category: categoryMap.get(space.category),
      owner: adminUser._id,
      isActive: true
    }));
    
    await Space.insertMany(spacesToCreate);
    console.log(`Created ${spacesToCreate.length} sample spaces`);

    console.log('Database seeded successfully!');
    console.log(`Admin: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}
seedDatabase();
