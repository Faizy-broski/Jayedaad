import type { LucideIcon } from 'lucide-react';

export type ListingType = 'sale' | 'rent';

export interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
  listingType: ListingType;
  verified?: boolean;
  beds: number;
  baths: number;
  areaSqft: number;
}

export type PropertyTypeOption = 'Villa' | 'Apartment' | 'Penthouse' | 'Townhouse' | 'House' | 'Bungalow';

export type AmenityOption = 'Swimming Pool' | 'Parking' | 'Garden' | 'Gym' | 'Security' | 'Elevator';

export interface ListingProperty extends Property {
  propertyType: PropertyTypeOption;
  /** Numeric PKR value backing `price`, used for range filtering/sorting. */
  priceValue: number;
  furnished: boolean;
  newProject: boolean;
  readyToMove: boolean;
  amenities: AmenityOption[];
  lat: number;
  lng: number;
  /** Everything below is only used by the /listings/[slug] detail page. */
  description: string;
  yearBuilt: number;
  parkingSpots: number;
  ownership: 'Freehold' | 'Leasehold';
  agent: {
    name: string;
    role: string;
    avatar: string;
    phone: string;
  };
}

export interface Category {
  id: string;
  label: string;
  listingsCount: number;
  image: string;
  href: string;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
}

export interface City {
  id: string;
  name: string;
  homesCount: number;
  image: string;
  href: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Only the first "Buy Property" tile is image-backed; everything else is a plain icon card. */
  image?: string;
}

export interface ComingProject {
  id: string;
  title: string;
  location: string;
  areaName: string;
  mapImage: string;
  price: string;
  description: string;
  image: string;
  beds: number;
  baths: number;
  areaSqft: number;
  agent: {
    name: string;
    avatar: string;
    phone: string;
  };
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  readTime: string;
  image: string;
  href: string;
}

export interface HowItWorksStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Where this card sits relative to the center house image. */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number; // 1-5
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}