import { httpClient } from './httpClient';
export const taxonomyRepository = {
    listPropertyTypes: async () => {
        const { data } = await httpClient.get('/taxonomy/property-types');
        return data;
    },
    // propertyTypeCategorySlug lets a listing-submission form only fetch
    // amenities relevant to the property type being listed (e.g. Plots don't
    // get Drawing Room/Servant Quarters).
    listAmenities: async (propertyTypeCategorySlug) => {
        const { data } = await httpClient.get('/taxonomy/amenities', { params: { propertyTypeCategorySlug } });
        return data;
    },
};
