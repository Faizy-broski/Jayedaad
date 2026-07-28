import { Amenity, PropertyType } from '../models';
export declare const taxonomyRepository: {
    listPropertyTypes: () => Promise<PropertyType[]>;
    listAmenities: (propertyTypeCategorySlug?: string) => Promise<Amenity[]>;
};
