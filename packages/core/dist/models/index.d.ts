export type Role = 'super_admin' | 'verification_staff' | 'agent' | 'buyer' | 'owner';
export type ListingStatus = 'draft' | 'pending_verification' | 'verified' | 'rejected' | 'expired' | 'deleted' | 'downgraded' | 'inactive';
export type ListingPurpose = 'sale' | 'rent';
export type AreaUnit = 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'furnished';
export interface PropertyTypeCategory {
    id: string;
    slug: string;
    label: string;
    sortOrder: number;
}
export interface PropertyTypeCategorySummary {
    slug: string;
    label: string;
}
export type AmenityCategory = 'main_features' | 'rooms' | 'business_communication' | 'community_features' | 'healthcare_recreation' | 'nearby_locations' | 'other_facilities';
export type ListingBoostTier = 'basic' | 'premium' | 'hot' | 'super_hot';
export interface PropertyType {
    id: string;
    slug: string;
    label: string;
    category: PropertyTypeCategorySummary;
}
export type AmenityValueType = 'boolean' | 'number' | 'text' | 'select';
export interface Amenity {
    id: string;
    slug: string;
    label: string;
    category: AmenityCategory;
    valueType: AmenityValueType;
    valueUnit: string | null;
    options: string[] | null;
    propertyTypeCategories: PropertyTypeCategorySummary[];
}
export interface CreatePropertyTypeCategoryInput {
    slug: string;
    label: string;
    sortOrder?: number;
}
export interface UpdatePropertyTypeCategoryInput {
    slug?: string;
    label?: string;
    sortOrder?: number;
}
export interface CreatePropertyTypeInput {
    slug: string;
    label: string;
    categoryId: string;
    sortOrder?: number;
}
export interface UpdatePropertyTypeInput {
    slug?: string;
    label?: string;
    categoryId?: string;
    sortOrder?: number;
}
export interface CreateAmenityInput {
    slug: string;
    label: string;
    category: AmenityCategory;
    valueType?: AmenityValueType;
    valueUnit?: string;
    options?: string[];
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export interface UpdateAmenityInput {
    slug?: string;
    label?: string;
    category?: AmenityCategory;
    valueType?: AmenityValueType;
    valueUnit?: string;
    options?: string[];
    propertyTypeCategoryIds?: string[];
    sortOrder?: number;
}
export interface PropertyTypeSummary {
    slug: string;
    label: string;
    category: PropertyTypeCategorySummary;
}
export interface ListingMediaItem {
    url: string;
    type: 'image' | 'video';
    compressedUrl: string | null;
    isCover: boolean;
    sortOrder: number;
}
export type ContactNumberType = 'mobile' | 'landline';
export interface ListingContactNumber {
    type: ContactNumberType;
    countryCode: string;
    number: string;
}
export interface AmenitySummary {
    slug: string;
    label: string;
    category: AmenityCategory;
}
export interface ListingAmenity extends AmenitySummary {
    valueType: AmenityValueType;
    valueUnit: string | null;
    options: string[] | null;
    value: number | null;
    textValue: string | null;
}
export interface Listing {
    id: string;
    listingNumber: number;
    title: string;
    description: string | null;
    price: string;
    purpose: ListingPurpose;
    city: string;
    area: string;
    society: string | null;
    subArea: string | null;
    latitude: number | null;
    longitude: number | null;
    propertyType: PropertyTypeSummary;
    bedrooms: number | null;
    bathrooms: number | null;
    kitchens: number | null;
    floors: number | null;
    areaValue: string;
    areaUnit: AreaUnit;
    yearBuilt: number | null;
    floorLevel: string | null;
    furnishingStatus: FurnishingStatus | null;
    boostTier: ListingBoostTier;
    installmentAvailable: boolean;
    readyForPossession: boolean;
    advanceAmount: number | null;
    numberOfInstallments: number | null;
    monthlyInstallment: number | null;
    balloonPaymentAvailable: boolean;
    balloonPaymentAmount: number | null;
    ballotingFeeApplicable: boolean;
    ballotingFeeAmount: number | null;
    possessionFeeApplicable: boolean;
    possessionFeeAmount: number | null;
    developmentFeeApplicable: boolean;
    developmentFeeAmount: number | null;
    status: ListingStatus;
    createdAt: string;
    media: ListingMediaItem[];
    amenities: ListingAmenity[];
    contactNumbers: ListingContactNumber[];
    agent: ListingAgentSummary | null;
}
export interface ListingAgentSummary {
    id: string;
    displayName: string | null;
    photoUrl: string | null;
    agency: {
        name: string;
        slug: string;
        logoUrl: string | null;
    } | null;
    subscriptionTierName: string | null;
}
export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';
export type LeadSource = 'chatbot' | 'contact_form' | 'call_request';
export type LeadInquirerType = 'buyer_tenant' | 'agent' | 'other';
export interface Lead {
    id: string;
    listingId: string;
    agentId: string | null;
    name: string;
    phone: string;
    email: string;
    message: string;
    inquirerType: LeadInquirerType | null;
    wantsSimilarAlerts: boolean;
    status: LeadStatus;
    source: LeadSource;
    createdAt: string;
}
export interface LeadNote {
    id: string;
    leadId: string;
    authorId: string;
    body: string;
    createdAt: string;
}
export interface SubscriptionUsage {
    used: number;
    quota: number;
}
export interface AuthUser {
    id: string;
    role: Role;
    agentId?: string;
}
export interface AdminUser {
    id: string;
    role: Role;
    agentId: string | null;
    email: string;
    displayName: string | null;
    createdAt: string;
}
export interface CreateUserInput {
    email: string;
    password: string;
    role: Role;
    displayName?: string;
    agencyId?: string;
}
export interface ListUsersFilters {
    roles?: Role[];
}
export interface RoleAccessDescription {
    role: Role;
    label: string;
    description: string;
    capabilities: string[];
}
export interface UpdateUserRoleInput {
    role: Role;
}
export interface SubscriptionTier {
    id: string;
    name: string;
    listingQuota: number;
    price: number;
    analyticsDepth: Record<string, unknown>;
}
export interface CreateSubscriptionTierInput {
    name: string;
    listingQuota: number;
    price?: number;
    analyticsDepth: Record<string, unknown>;
}
export interface UpdateSubscriptionTierInput {
    name?: string;
    listingQuota?: number;
    price?: number;
    analyticsDepth?: Record<string, unknown>;
}
export interface Subscription {
    agentId: string;
    tierId: string;
    status: string;
    currentPeriodEnd: string | null;
    tier: SubscriptionTier;
}
export interface AssignSubscriptionInput {
    tierId: string;
    currentPeriodEnd?: string;
}
export interface GrantAgentCreditsInput {
    creditType: AgentCreditType;
    total?: number;
    used?: number;
}
export interface SetListingStatusInput {
    status: ListingStatus;
}
export interface PlatformStats {
    usersByRole: Record<string, number>;
    agenciesByVerificationStatus: Record<string, number>;
    listingsByStatus: Record<string, number>;
    leadsByStatus: Record<string, number>;
    activeSubscriptionsByTier: Record<string, number>;
}
export interface AgentOverview {
    id: string;
    displayName: string | null;
    phone: string | null;
    city: string | null;
    verificationStatus: string;
    agency: {
        id: string;
        name: string;
        slug: string;
    } | null;
    subscription: {
        status: string;
        currentPeriodEnd: string | null;
        tierName: string | null;
    } | null;
    listingCounts: {
        total: number;
        verified: number;
    };
}
export type VerificationAuditAction = 'approve' | 'reject' | 'request_info';
export interface VerificationAuditLogEntry {
    id: string;
    listingId: string;
    reviewerId: string;
    action: VerificationAuditAction;
    note: string | null;
    createdAt: string;
}
export interface PaginatedAuditLog {
    items: VerificationAuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
}
export type AgencyVerificationStatus = 'pending' | 'verified' | 'rejected';
export interface Agency {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    address: string | null;
    businessHours: string | null;
    verificationStatus: AgencyVerificationStatus;
}
export interface CreateAgencyInput {
    name: string;
    slug: string;
    description?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    businessHours?: string;
    logoUrl?: string;
}
export interface UpdateAgencyInput {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    businessHours?: string;
    logoUrl?: string;
}
export interface SetAgencyVerificationStatusInput {
    status: 'verified' | 'rejected';
}
export interface AgencyStaffMember {
    id: string;
    displayName: string | null;
    phone: string | null;
    city: string | null;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    isAgencyAdmin: boolean;
}
export interface CreateAgencyStaffInput {
    email: string;
    password: string;
    displayName?: string;
}
export interface RegisterAgencyInput {
    agencyName: string;
    agencySlug: string;
    agencyPhone?: string;
    agencyCity?: string;
    displayName?: string;
    agentPhone?: string;
}
export interface AgencyStats {
    forSaleCount: number;
    forRentCount: number;
    byPropertyType: {
        label: string;
        forSale: number;
        forRent: number;
    }[];
    byBoostTier: {
        tier: ListingBoostTier;
        count: number;
    }[];
}
export interface AgentProfileSummary {
    id: string;
    displayName: string | null;
    title: string | null;
    bio: string | null;
    phone: string | null;
    whatsapp: string | null;
    landline: string | null;
    city: string | null;
    address: string | null;
    photoUrl: string | null;
    agency: Agency | null;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    isAgencyAdmin: boolean;
}
export interface ApplyAsAgentInput {
    displayName?: string;
    phone?: string;
    city?: string;
}
export interface PendingAgentApplication extends AgentProfileSummary {
    documents: {
        required: string[];
        uploaded: string[];
        missing: string[];
    };
}
export interface UserPreferences {
    emailNotifications: boolean;
    newsletters: boolean;
    automatedReports: boolean;
    preferredCurrency: string;
    preferredAreaUnit: AreaUnit;
}
export interface AgentStats {
    forSaleCount: number;
    forRentCount: number;
    byPropertyType: {
        label: string;
        forSale: number;
        forRent: number;
    }[];
    byBoostTier: {
        tier: ListingBoostTier;
        count: number;
    }[];
}
export interface AgentAnalytics {
    views: number;
    clicks: number;
    leads: number;
    calls: number;
    whatsapp: number;
    sms: number;
    emails: number;
}
export type ListingEngagementType = 'view' | 'click' | 'call' | 'whatsapp' | 'sms' | 'email';
export type AgentCreditType = 'listing_quota' | 'refresh' | 'hot' | 'super_hot';
export interface AgentCredit {
    creditType: AgentCreditType;
    total: number;
    used: number;
    available: number;
}
export interface AgentReview {
    id: string;
    agentId: string;
    reviewerId: string;
    rating: number;
    body: string | null;
    createdAt: string;
}
export interface Favorite {
    id: string;
    listingId: string;
    createdAt: string;
    listing: {
        id: string;
        title: string;
        price: number;
        city: string;
        area: string;
        status: ListingStatus;
    } | null;
}
export type AlertFrequency = 'instant' | 'daily' | 'weekly' | 'off';
export interface SavedSearch {
    id: string;
    name: string | null;
    filters: ListingSearchFiltersJson;
    alertFrequency: AlertFrequency;
    lastNotifiedAt: string | null;
    createdAt: string;
}
export interface ListingSearchFiltersJson {
    city?: string;
    area?: string;
    propertyTypeSlug?: string;
    purpose?: ListingPurpose;
    bedrooms?: number;
    minBathrooms?: number;
    minAreaValue?: number;
    maxAreaValue?: number;
    areaUnit?: AreaUnit;
}
export type ProjectStatus = 'planned' | 'under_construction' | 'ready';
export interface Developer {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    phone: string | null;
    whatsapp: string | null;
    city: string | null;
}
export interface DeveloperWithStats extends Developer {
    projectCount: number;
}
export interface CreateDeveloperInput {
    name: string;
    slug: string;
    logoUrl?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
}
export interface UpdateDeveloperInput {
    name?: string;
    logoUrl?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
}
export interface DeveloperSummary {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
}
export interface ProjectUnitType {
    id: string;
    label: string;
    propertyType: PropertyTypeSummary;
    areaValueMin: string | null;
    areaValueMax: string | null;
    areaUnit: AreaUnit;
    priceMin: string | null;
    priceMax: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
}
export interface ProjectPaymentPlan {
    id: string;
    label: string;
    bookingPercent: number | null;
    installmentCount: number | null;
    installmentFrequency: string | null;
    balloonPaymentCount: number | null;
    planDocumentUrl: string | null;
    description: string | null;
}
export interface ProjectPriceRange {
    min: number;
    max: number;
}
export interface Project {
    id: string;
    name: string;
    slug: string;
    developer: DeveloperSummary;
    description: string | null;
    city: string;
    area: string;
    status: ProjectStatus;
    possessionDate: string | null;
    coverImageUrl: string | null;
    unitTypes: ProjectUnitType[];
    paymentPlans: ProjectPaymentPlan[];
    amenities: AmenitySummary[];
    priceRange: ProjectPriceRange | null;
}
export interface ProjectSearchFilters {
    city?: string;
    status?: ProjectStatus;
    propertyTypeSlug?: string;
    developerSlug?: string;
    minPrice?: number;
    maxPrice?: number;
    minAreaValue?: number;
    maxAreaValue?: number;
    areaUnit?: AreaUnit;
    keyword?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    pageSize?: number;
}
export interface PaginatedProjects {
    items: Project[];
    total: number;
    page: number;
    pageSize: number;
}
export interface ProjectCityCount {
    city: string;
    count: number;
}
export interface ProjectCategoryCount {
    propertyType: PropertyTypeSummary;
    count: number;
}
export interface CreateProjectUnitTypeInput {
    label: string;
    propertyTypeSlug: string;
    areaValueMin?: number;
    areaValueMax?: number;
    areaUnit: AreaUnit;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
}
export interface CreateProjectPaymentPlanInput {
    label: string;
    bookingPercent?: number;
    installmentCount?: number;
    installmentFrequency?: string;
    balloonPaymentCount?: number;
    planDocumentUrl?: string;
    description?: string;
}
export interface CreateProjectInput {
    name: string;
    slug: string;
    developerId: string;
    description?: string;
    city: string;
    area: string;
    status?: ProjectStatus;
    possessionDate?: string;
    coverImageUrl?: string;
    unitTypes?: CreateProjectUnitTypeInput[];
    paymentPlans?: CreateProjectPaymentPlanInput[];
    amenitySlugs?: string[];
}
export type NotificationType = 'price_drop' | 'new_match' | 'inquiry_reply' | 'verification_status' | 'lead_assigned' | 'reminder';
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    relatedListingId: string | null;
    relatedLeadId: string | null;
    readAt: string | null;
    createdAt: string;
}
export type ListingDocumentType = 'id_card_front' | 'id_card_back' | 'ownership_proof' | 'utility_bill';
export type OnboardingDocumentType = 'company_registration' | 'owner_id_card' | 'tax_certificate';
export interface ListingDocument {
    id: string;
    documentType: ListingDocumentType;
    url: string;
    uploadedAt: string;
}
export interface OnboardingDocument {
    id: string;
    documentType: OnboardingDocumentType;
    url: string;
    uploadedAt: string;
}
export interface OnboardingDocument {
    id: string;
    documentType: OnboardingDocumentType;
    url: string;
    uploadedAt: string;
}
export interface DocumentCompleteness<T extends string = string> {
    required: T[];
    uploaded: T[];
    missing: T[];
}
export interface SetAgentVerificationStatusInput {
    status: 'verified' | 'rejected';
}
